import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const dpsUserService = { getCaseloads: jest.fn(), getDpsUser: jest.fn(), createLinkedDpsUser: jest.fn() }
const auditService = createAuditServiceMock()

const createUrl = paths.dpsUser.createLinkedDpsUser.pattern

const createForm = {
  userType: 'DPS_GEN',
  existingUsername: 'EXISTING',
  username: 'NEWUSER',
  defaultCaseloadId: 'MDI',
}

const searchForm = { userType: 'DPS_GEN', existingUsername: 'EXISTING', searchUser: 'search' }

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.CREATE_USER]) =>
  appWithAllRoutes({
    services: { dpsUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

const flashedBody = () => JSON.parse(flashStore.requestBody[0] as string)

beforeEach(() => {
  flashStore = useInMemoryFlash()
  dpsUserService.getCaseloads.mockResolvedValue([])
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET create linked DPS user', () => {
  it('redirects to the select user type page when no user type has been chosen', async () => {
    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(paths.dpsUser.createUser.pattern)
  })

  it('redirects to the auth error page without the create user role', async () => {
    app = buildApp(['ROLE_OTHER'])

    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST create linked DPS user - search for existing user', () => {
  it('flashes the found user details and redirects back', async () => {
    dpsUserService.getDpsUser.mockResolvedValue({
      username: 'EXISTING',
      firstName: 'Jane',
      lastName: 'Smith',
      primaryEmail: 'jane.smith@justice.gov.uk',
    })

    const res = await request(app).post(createUrl).type('form').send(searchForm)

    expect(res.headers.location).toBe(createUrl)
    expect(dpsUserService.getDpsUser).toHaveBeenCalledWith(expect.any(String), 'EXISTING')
    expect(flashedBody()).toEqual({
      ...searchForm,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@justice.gov.uk',
    })
    expect(dpsUserService.createLinkedDpsUser).not.toHaveBeenCalled()
  })

  it('trims whitespace from the existing username before searching', async () => {
    dpsUserService.getDpsUser.mockResolvedValue({ username: 'EXISTING' })

    await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...searchForm, existingUsername: '  EXISTING  ' })

    expect(dpsUserService.getDpsUser).toHaveBeenCalledWith(expect.any(String), 'EXISTING')
  })

  it('only validates the existing username when searching', async () => {
    dpsUserService.getDpsUser.mockResolvedValue({ username: 'EXISTING' })

    const res = await request(app).post(createUrl).type('form').send(searchForm)

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toBeUndefined()
  })

  it('flashes an error when the existing username is missing', async () => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...searchForm, existingUsername: '   ' })

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([{ href: '#existingUsername', text: 'Enter an existing username' }])
    expect(dpsUserService.getDpsUser).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'a bad request',
      error: { responseStatus: HttpStatusCode.BAD_REQUEST, data: { userMessage: 'Bad search' } },
      expected: { text: 'Bad search' },
    },
    {
      name: 'a user that is not found',
      error: { responseStatus: HttpStatusCode.NOT_FOUND },
      expected: { href: '#existingUsername', text: 'Existing username not found' },
    },
  ])('flashes the error and redirects back for $name', async ({ error, expected }) => {
    dpsUserService.getDpsUser.mockRejectedValue(error)

    const res = await request(app).post(createUrl).type('form').send(searchForm)

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([expected])
    expect(flashedBody()).toEqual(searchForm)
  })

  it('returns an error for other API failures', async () => {
    dpsUserService.getDpsUser.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(createUrl).type('form').send(searchForm)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })
})

describe('POST create linked DPS user - create', () => {
  it('creates the linked user, audits and renders the success page', async () => {
    dpsUserService.createLinkedDpsUser.mockResolvedValue('NEWUSER')

    const res = await request(app).post(createUrl).type('form').send(createForm)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('DPS user created')
    expect(res.text).toContain('NEWUSER')
    expect(dpsUserService.createLinkedDpsUser).toHaveBeenCalledWith(expect.any(String), createForm)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.CREATE_LINKED_DPS_USER,
      who: user.username,
      subjectId: 'NEWUSER',
      subjectType: 'USER_ID',
      details: createForm,
    })
  })

  it('trims whitespace from the form values before creating the user', async () => {
    dpsUserService.createLinkedDpsUser.mockResolvedValue('NEWUSER')

    await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...createForm, existingUsername: '  EXISTING  ', username: '  NEWUSER  ' })

    expect(dpsUserService.createLinkedDpsUser).toHaveBeenCalledWith(expect.any(String), createForm)
  })

  it('does not require a caseload for a central admin', async () => {
    dpsUserService.createLinkedDpsUser.mockResolvedValue('NEWUSER')

    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...createForm, userType: 'DPS_ADM', defaultCaseloadId: undefined })

    expect(res.status).toBe(HttpStatusCode.OK)
  })

  it('flashes errors when the username and caseload are missing', async () => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...createForm, username: '', defaultCaseloadId: '--' })

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([
      { href: '#username', text: 'Enter a username' },
      { href: '#defaultCaseloadId', text: 'Select a default caseload' },
    ])
    expect(dpsUserService.createLinkedDpsUser).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'a bad request',
      error: { responseStatus: HttpStatusCode.BAD_REQUEST, data: { userMessage: 'Bad user' } },
      expected: { text: 'Bad user' },
    },
    {
      name: 'a username already linked to another account',
      error: {
        responseStatus: HttpStatusCode.CONFLICT,
        data: { userMessage: 'Username already exists for this staff member' },
      },
      expected: { href: '#existingUsername', text: 'Username already linked to another account' },
    },
    {
      name: 'an existing username',
      error: { responseStatus: HttpStatusCode.CONFLICT, data: { userMessage: 'Username exists' } },
      expected: { href: '#username', text: 'Username already exists' },
    },
    {
      name: 'a user that is not found',
      error: { responseStatus: HttpStatusCode.NOT_FOUND },
      expected: { href: '#existingUsername', text: 'Username not found' },
    },
  ])('flashes the error and redirects back for $name', async ({ error, expected }) => {
    dpsUserService.createLinkedDpsUser.mockRejectedValue(error)

    const res = await request(app).post(createUrl).type('form').send(createForm)

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([expected])
    expect(flashedBody()).toEqual(createForm)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    dpsUserService.createLinkedDpsUser.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(createUrl).type('form').send(createForm)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
