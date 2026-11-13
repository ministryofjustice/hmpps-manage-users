import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import config from '../../config'
import { CsvValidationError } from '../../services/bulkUserRolesService'
import { HttpStatusCode } from '../../utils/utils'

const bulkUserRolesService = {
  getSelectableRoles: jest.fn(),
  countAndValidateUsersCsv: jest.fn(),
  submitBulkUserRoleAdditionsJob: jest.fn(),
}
const auditService = createAuditServiceMock()

const { jiraReference, selectRoles, uploadUsers, summary, submit, root } = paths.bulkUserRoles.create
const jiraUrl = jiraReference.pattern
const selectRolesUrl = selectRoles.pattern
const uploadUsersUrl = uploadUsers.pattern
const summaryUrl = summary.pattern
const submitUrl = submit.pattern
const rootUrl = root.pattern

const csv = Buffer.from('username\nUSER1\nUSER2\n')

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MANAGE_USER_BULK_JOBS]) =>
  appWithAllRoutes({
    services: { bulkUserRolesService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

// An agent keeps the session cookie so the multi-step request is retained between calls
const agent = () => request.agent(app)

const completeRequest = async (a: ReturnType<typeof agent>) => {
  await a.post(jiraUrl).type('form').send({ jiraReference: 'JIRA-1' })
  await a
    .post(selectRolesUrl)
    .type('form')
    .send({ selectedRoles: ['ROLE_A', 'ROLE_B'] })
  await a.post(uploadUsersUrl).attach('file', csv, 'users.csv')
}

beforeEach(() => {
  flashStore = useInMemoryFlash()
  bulkUserRolesService.getSelectableRoles.mockResolvedValue([
    { roleCode: 'ROLE_A', roleName: 'Role A' },
    { roleCode: 'ROLE_B', roleName: 'Role B' },
    { roleCode: 'ROLE_C', roleName: 'Role C' },
  ])
  bulkUserRolesService.countAndValidateUsersCsv.mockResolvedValue(2)
  bulkUserRolesService.submitBulkUserRoleAdditionsJob.mockResolvedValue(undefined)
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('role guard', () => {
  it.each([rootUrl, selectRolesUrl, uploadUsersUrl, summaryUrl])('redirects GET %s without the role', async url => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(url)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('jira reference', () => {
  it('renders the first step', async () => {
    const res = await request(app).get(rootUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Change user roles in bulk')
    expect(res.text).toContain('Jira reference')
  })

  it('trims the reference and moves on to selecting roles', async () => {
    const a = agent()

    const res = await a.post(jiraUrl).type('form').send({ jiraReference: '  JIRA-1  ' })

    expect(res.headers.location).toBe(selectRolesUrl)
    const summaryPage = await a.get(summaryUrl)
    expect(summaryPage.text).toContain('JIRA-1')
  })

  it.each(['', '   '])('flashes an error and redirects back for the reference %p', async value => {
    const res = await request(app).post(jiraUrl).type('form').send({ jiraReference: value })

    expect(res.headers.location).toBe(rootUrl)
    expect(flashStore.errors).toEqual([
      { text: 'jira reference is required and cannot be empty', href: '#jira-reference-input' },
    ])
  })

  it('goes straight to the summary when everything has already been provided', async () => {
    const a = agent()
    await completeRequest(a)

    const res = await a.post(jiraUrl).type('form').send({ jiraReference: 'JIRA-2' })

    expect(res.headers.location).toBe(summaryUrl)
  })
})

describe('select roles', () => {
  it('renders the selectable roles', async () => {
    const res = await request(app).get(selectRolesUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Role A')
    expect(res.text).toContain('Role C')
  })

  it('stores the roles and moves on to uploading users', async () => {
    const res = await request(app)
      .post(selectRolesUrl)
      .type('form')
      .send({ selectedRoles: ['ROLE_A', 'ROLE_B'] })

    expect(res.headers.location).toBe(uploadUsersUrl)
  })

  it('accepts a single role posted as a string', async () => {
    const res = await request(app).post(selectRolesUrl).type('form').send({ selectedRoles: 'ROLE_A' })

    expect(res.headers.location).toBe(uploadUsersUrl)
  })

  it('flashes an error when no role is selected', async () => {
    const res = await request(app).post(selectRolesUrl).type('form').send({})

    expect(res.headers.location).toBe(selectRolesUrl)
    expect(flashStore.errors).toEqual([{ text: 'at least one role must be selected', href: '#select-roles-table' }])
  })

  it('flashes an error when too many roles are selected', async () => {
    const { maxBulkRolesSelection } = config.app
    bulkUserRolesService.getSelectableRoles.mockResolvedValue(
      Array.from({ length: maxBulkRolesSelection + 1 }, (_, i) => ({ roleCode: `R${i}`, roleName: `Role ${i}` })),
    )
    const selectedRoles = Array.from({ length: maxBulkRolesSelection + 1 }, (_, i) => `R${i}`)

    const res = await request(app).post(selectRolesUrl).type('form').send({ selectedRoles })

    expect(res.headers.location).toBe(selectRolesUrl)
    expect(flashStore.errors).toEqual([
      { text: `a maximum of ${maxBulkRolesSelection} roles can be selected`, href: '#select-roles-table' },
    ])
  })

  it('flashes an error and keeps only the valid selections when an invalid role is selected', async () => {
    const res = await request(app)
      .post(selectRolesUrl)
      .type('form')
      .send({ selectedRoles: ['ROLE_A', 'NOT_A_ROLE'] })

    expect(res.headers.location).toBe(selectRolesUrl)
    expect(flashStore.errors).toEqual([{ text: 'invalid role value selected NOT_A_ROLE', href: '#select-roles-table' }])
    expect(JSON.parse(flashStore.requestBody[0] as string)).toEqual({ selectedRoles: ['ROLE_A'] })
  })
})

describe('upload users', () => {
  it('renders the upload page', async () => {
    const res = await request(app).get(uploadUsersUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
  })

  it('validates the file, stores it and moves on to the summary', async () => {
    const res = await request(app).post(uploadUsersUrl).attach('file', csv, 'users.csv')

    expect(res.headers.location).toBe(summaryUrl)
    expect(bulkUserRolesService.countAndValidateUsersCsv).toHaveBeenCalledWith(
      expect.objectContaining({ originalname: 'users.csv', buffer: csv }),
    )
  })

  it('flashes an error when no file is uploaded', async () => {
    const res = await request(app).post(uploadUsersUrl).type('form').send({})

    expect(res.headers.location).toBe(uploadUsersUrl)
    expect(flashStore.errors).toEqual([{ text: 'file is required but was null', href: '#upload-users-file' }])
  })

  it('flashes the validation message when the csv is invalid', async () => {
    bulkUserRolesService.countAndValidateUsersCsv.mockRejectedValue(new CsvValidationError('csv file is required'))

    const res = await request(app).post(uploadUsersUrl).attach('file', csv, 'users.txt')

    expect(res.headers.location).toBe(uploadUsersUrl)
    expect(flashStore.errors).toEqual([{ text: 'csv file is required', href: '#upload-users-file' }])
  })

  it('returns an error for unexpected failures', async () => {
    bulkUserRolesService.countAndValidateUsersCsv.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(uploadUsersUrl).attach('file', csv, 'users.csv')

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })
})

describe('summary', () => {
  it('lists what is missing when the request is incomplete', async () => {
    const res = await request(app).get(summaryUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Jira reference is required')
    expect(res.text).toContain('Roles is required')
    expect(res.text).toContain('Upload file is required')
  })

  it('shows the details of the completed request', async () => {
    const a = agent()
    await completeRequest(a)

    const res = await a.get(summaryUrl)

    expect(res.text).toContain('JIRA-1')
    expect(res.text).toContain('users.csv')
    expect(res.text).not.toContain('Jira reference is required')
  })
})

describe('submit', () => {
  it('redirects to the summary when the request is incomplete', async () => {
    const res = await request(app).post(submitUrl)

    expect(res.headers.location).toBe(summaryUrl)
    expect(bulkUserRolesService.submitBulkUserRoleAdditionsJob).not.toHaveBeenCalled()
  })

  it('submits the job, audits it and shows the confirmation', async () => {
    const a = agent()
    await completeRequest(a)

    const res = await a.post(submitUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain(paths.bulkUserRoles.view.list.pattern)
    expect(bulkUserRolesService.submitBulkUserRoleAdditionsJob).toHaveBeenCalledWith(
      expect.any(String),
      'JIRA-1',
      ['ROLE_A', 'ROLE_B'],
      { buffer: csv, originalname: 'users.csv' },
    )
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.SUBMIT_BULK_USER_ROLE_ADDITIONS_ATTEMPT,
      who: user.username,
      subjectId: 'JIRA-1',
      subjectType: 'JIRA_REFERENCE',
      details: { roles: ['ROLE_A', 'ROLE_B'], usersCsv: 'users.csv' },
    })
  })

  it('clears the request once submitted', async () => {
    const a = agent()
    await completeRequest(a)
    await a.post(submitUrl)

    const res = await a.post(submitUrl)

    expect(res.headers.location).toBe(summaryUrl)
    expect(bulkUserRolesService.submitBulkUserRoleAdditionsJob).toHaveBeenCalledTimes(1)
  })

  it('audits a failure, flashes an error and keeps the request when the submit fails', async () => {
    bulkUserRolesService.submitBulkUserRoleAdditionsJob.mockRejectedValue(new Error('boom'))
    const a = agent()
    await completeRequest(a)

    const res = await a.post(submitUrl)

    expect(res.headers.location).toBe(summaryUrl)
    expect(flashStore.errors).toEqual([{ text: 'Internal Server Error' }])
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.SUBMIT_BULK_USER_ROLE_ADDITIONS_FAILURE,
      who: user.username,
      subjectId: 'JIRA-1',
      subjectType: 'JIRA_REFERENCE',
    })
    const summaryPage = await a.get(summaryUrl)
    expect(summaryPage.text).toContain('JIRA-1')
  })
})
