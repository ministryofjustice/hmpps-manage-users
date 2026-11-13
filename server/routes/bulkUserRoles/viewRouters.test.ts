import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType, Page } from '../audit'
import paginationService from '../../services/paginationService'
import { HttpStatusCode } from '../../utils/utils'

const bulkUserRolesService = {
  getBulkUserRoleAdditionsJobs: jest.fn(),
  getBulkUserRoleAdditionsJob: jest.fn(),
  downloadBulkUserRoleAdditionsJobCsv: jest.fn(),
}
const auditService = createAuditServiceMock()

const id = 'job-123'
const listUrl = paths.bulkUserRoles.view.list.pattern
const detailsUrl = paths.bulkUserRoles.view.details({ id })
const downloadUrl = paths.bulkUserRoles.view.download({ id })

const job = {
  id,
  jiraReference: 'JIRA-123',
  requestedBy: 'REQUESTER',
  requestDateTime: '2026-01-02T10:30:00',
  status: 'COMPLETE',
  totalCount: 10,
  successCount: 8,
  errorCount: 2,
}

let app: Express

const buildApp = (roles: string[] = [AuthRole.MANAGE_USER_BULK_JOBS]) =>
  appWithAllRoutes({
    services: { bulkUserRolesService, auditService, paginationService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  useInMemoryFlash()
  bulkUserRolesService.getBulkUserRoleAdditionsJobs.mockResolvedValue({ content: [job], totalElements: 1, number: 0 })
  bulkUserRolesService.getBulkUserRoleAdditionsJob.mockResolvedValue(job)
  bulkUserRolesService.downloadBulkUserRoleAdditionsJobCsv.mockResolvedValue({
    headers: { 'content-type': 'text/csv', 'content-disposition': 'attachment; filename="results.csv"' },
    text: 'username,result\nUSER1,OK',
  })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET bulk user roles list', () => {
  it('renders the requests with a link to their details and audits the page view', async () => {
    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('View bulk role changes')
    expect(res.text).toContain('JIRA-123')
    expect(res.text).toContain(detailsUrl)
    expect(bulkUserRolesService.getBulkUserRoleAdditionsJobs).toHaveBeenCalledWith(expect.any(String), 0, 20, undefined)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_BULK_USER_ROLE_ADDITIONS_LIST, {
      who: user.username,
      details: { page: 0, keyword: undefined },
    })
  })

  it('passes the keyword and page to the service', async () => {
    await request(app).get(listUrl).query({ keyword: 'JIRA', page: '2' })

    expect(bulkUserRolesService.getBulkUserRoleAdditionsJobs).toHaveBeenCalledWith(expect.any(String), 2, 20, 'JIRA')
  })

  it('shows the error on the page when the requests cannot be fetched', async () => {
    bulkUserRolesService.getBulkUserRoleAdditionsJobs.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('API responded with: boom')
  })

  it('redirects to the auth error page without the manage user bulk jobs role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(listUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('GET bulk user roles details', () => {
  it('renders the request and audits the page view', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Bulk user roles change')
    expect(res.text).toContain('JIRA-123')
    expect(res.text).toContain('REQUESTER')
    expect(res.text).toContain(downloadUrl)
    expect(bulkUserRolesService.getBulkUserRoleAdditionsJob).toHaveBeenCalledWith(expect.any(String), id)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_BULK_USER_ROLE_ADDITIONS_DETAILS, {
      who: user.username,
      subjectId: id,
      subjectType: 'BULK_USER_ROLES_ADDITIONS_JOB_ID',
    })
  })

  it('disables the download while the request is pending', async () => {
    bulkUserRolesService.getBulkUserRoleAdditionsJob.mockResolvedValue({ ...job, status: 'PENDING' })

    const res = await request(app).get(detailsUrl)

    expect(res.text).toMatch(/<button[^>]*\sdisabled[^>]*data-qa="download"/)
  })

  it('shows the error on the page when the request cannot be fetched', async () => {
    bulkUserRolesService.getBulkUserRoleAdditionsJob.mockRejectedValue(new Error('not found'))

    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('not found')
    expect(res.text).not.toContain('data-qa="download"')
  })

  it('redirects to the auth error page without the manage user bulk jobs role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(detailsUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('GET bulk user roles download', () => {
  it('returns the results csv and audits the attempt', async () => {
    const res = await request(app).get(downloadUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toBe('attachment; filename="results.csv"')
    expect(res.text).toBe('username,result\nUSER1,OK')
    expect(bulkUserRolesService.downloadBulkUserRoleAdditionsJobCsv).toHaveBeenCalledWith(expect.any(String), id)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.DOWNLOAD_BULK_USER_ROLE_ADDITIONS_CSV_ATTEMPT,
      who: user.username,
      subjectId: id,
      subjectType: 'BULK_USER_ROLES_ADDITIONS_JOB_ID',
    })
  })

  it('falls back to a default filename when the response has no headers', async () => {
    bulkUserRolesService.downloadBulkUserRoleAdditionsJobCsv.mockResolvedValue({ text: 'a,b' })

    const res = await request(app).get(downloadUrl)

    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toBe(`attachment; filename="bulk-roles-assignments-${id}.csv"`)
  })

  it('returns a json error file with a 200 and audits a failure when the download fails', async () => {
    bulkUserRolesService.downloadBulkUserRoleAdditionsJobCsv.mockRejectedValue({
      responseStatus: 500,
      data: { message: 'Upstream failure' },
    })

    const res = await request(app).get(downloadUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.headers['content-type']).toContain('application/json')
    expect(res.headers['content-disposition']).toBe(`attachment; filename="bulk-roles-assignments-${id}-ERROR.json"`)
    expect(JSON.parse(res.text)).toEqual({ message: 'Upstream failure' })
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.DOWNLOAD_BULK_USER_ROLE_ADDITIONS_CSV_FAILURE,
      who: user.username,
      subjectId: id,
      subjectType: 'BULK_USER_ROLES_ADDITIONS_JOB_ID',
    })
  })

  it('uses a generic message for unexpected errors', async () => {
    bulkUserRolesService.downloadBulkUserRoleAdditionsJobCsv.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(downloadUrl)

    expect(JSON.parse(res.text)).toEqual({ message: 'An error occurred while downloading the results' })
  })

  it('redirects to the auth error page without the manage user bulk jobs role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(downloadUrl)

    expect(res.headers.location).toBe('/authError')
    expect(bulkUserRolesService.downloadBulkUserRoleAdditionsJobCsv).not.toHaveBeenCalled()
  })
})
