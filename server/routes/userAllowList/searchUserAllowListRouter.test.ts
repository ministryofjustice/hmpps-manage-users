import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import paginationService from '../../services/paginationService'
import manageUserAllowListHelper from '../../utils/manageUserAllowListHelper'
import { HttpStatusCode } from '../../utils/utils'

const userAllowListService = { getAllAllowListUsers: jest.fn() }
const auditService = createAuditServiceMock()

const searchUrl = paths.userAllowList.search.pattern
const downloadUrl = paths.userAllowList.download.pattern
const pageSize = manageUserAllowListHelper.pageSize()
const downloadLimit = manageUserAllowListHelper.downloadLimit()

const allowListUser = {
  username: 'ALLOWED1',
  firstName: 'Alan',
  lastName: 'Lowe',
  email: 'alan.lowe@justice.gov.uk',
  reason: 'Contractor',
  allowlistEndDate: '2999-01-01',
  userType: 'GENERAL',
}

let app: Express

const buildApp = (roles: string[] = [AuthRole.MANAGE_USER_ALLOW_LIST]) =>
  appWithAllRoutes({
    services: { userAllowListService, auditService, paginationService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  useInMemoryFlash()
  userAllowListService.getAllAllowListUsers.mockResolvedValue({
    content: [allowListUser],
    totalElements: 1,
    number: 0,
  })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET allow list search', () => {
  it('renders the results and audits the search attempt', async () => {
    const res = await request(app).get(searchUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('data-qa="edit-button-ALLOWED1"')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_ATTEMPT, who: user.username }),
    )
    expect(auditService.logAuditEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_FAILURE }),
    )
  })

  it('converts the query string into the search', async () => {
    await request(app).get(searchUrl).query({ user: '  alan  ', status: 'ACTIVE', userType: 'DIGITAL', page: '3' })

    expect(userAllowListService.getAllAllowListUsers).toHaveBeenCalledWith(expect.any(String), {
      name: 'alan',
      status: 'ACTIVE',
      userType: 'DIGITAL',
      page: 3,
      size: pageSize,
    })
  })

  it('defaults the status to ALL and ignores an unknown user type', async () => {
    await request(app).get(searchUrl).query({ userType: 'BOGUS' })

    expect(userAllowListService.getAllAllowListUsers).toHaveBeenCalledWith(expect.any(String), {
      name: undefined,
      status: 'ALL',
      userType: undefined,
      page: 0,
      size: pageSize,
    })
  })

  it('shows a message when there are no results', async () => {
    userAllowListService.getAllAllowListUsers.mockResolvedValue({ content: [], totalElements: 0, number: 0 })

    const res = await request(app).get(searchUrl)

    expect(res.text).toContain('data-qa="no-results"')
  })

  it('offers the download when the results are within the limit', async () => {
    const res = await request(app).get(searchUrl)

    expect(res.text).toContain('data-qa="download"')
  })

  it('hides the download when there are more results than the download limit', async () => {
    userAllowListService.getAllAllowListUsers.mockResolvedValue({
      content: [allowListUser],
      totalElements: downloadLimit + 1,
      number: 0,
    })

    const res = await request(app).get(searchUrl)

    expect(res.text).not.toContain('data-qa="download"')
    expect(res.text).toContain('data-qa="exceed-download-limit"')
  })

  it('audits a failure and returns an error when the search fails', async () => {
    userAllowListService.getAllAllowListUsers.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(searchUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_FAILURE }),
    )
  })

  it('redirects to the auth error page without the manage user allow list role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(searchUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('GET allow list download', () => {
  it('returns the search results as a csv attachment with the status', async () => {
    const res = await request(app).get(downloadUrl).query({ user: 'alan', status: 'ACTIVE' })

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('user-allowlist-search.csv')
    expect(res.text).toContain('"username","firstName","lastName"')
    expect(res.text).toContain('"ALLOWED1"')
    expect(res.text).toContain('"ACTIVE"')
    expect(userAllowListService.getAllAllowListUsers).toHaveBeenCalledWith(expect.any(String), {
      name: 'alan',
      status: 'ACTIVE',
      userType: undefined,
      page: 0,
      size: downloadLimit,
    })
  })

  it('returns a plain text error and audits a failure when the download fails', async () => {
    userAllowListService.getAllAllowListUsers.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(downloadUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.DOWNLOAD_REPORT_FAILURE }),
    )
  })

  it('redirects to the auth error page without the manage user allow list role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(downloadUrl)

    expect(res.headers.location).toBe('/authError')
    expect(userAllowListService.getAllAllowListUsers).not.toHaveBeenCalled()
  })
})
