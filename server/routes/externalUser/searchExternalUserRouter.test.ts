import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import paginationService from '../../services/paginationService'
import { HttpStatusCode } from '../../utils/utils'

const externalUserService = {
  assignableGroups: jest.fn(),
  getSearchableRoles: jest.fn(),
  searchUsers: jest.fn(),
}
const auditService = createAuditServiceMock()

const searchUrl = paths.externalUser.search.pattern
const downloadUrl = paths.externalUser.download.pattern

const searchResult = {
  userId: 'USER-ID',
  username: 'EXT_USER',
  firstName: 'Found',
  lastName: 'Person',
  email: 'found.person@example.com',
  enabled: true,
  locked: false,
  verified: true,
}

let app: Express

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS]) =>
  appWithAllRoutes({
    services: { externalUserService, auditService, paginationService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  useInMemoryFlash()
  externalUserService.assignableGroups.mockResolvedValue([{ groupCode: 'GROUP_A', groupName: 'Group A' }])
  externalUserService.getSearchableRoles.mockResolvedValue([{ roleCode: 'SOME_ROLE', roleName: 'Some Role' }])
  externalUserService.searchUsers.mockResolvedValue({ content: [searchResult], totalElements: 1, number: 0 })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET external user search', () => {
  it('renders the results and audits the search attempt', async () => {
    const res = await request(app).get(searchUrl).query({ user: 'found' })

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('data-qa="edit-button-EXT_USER"')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_ATTEMPT, who: user.username }),
    )
    expect(auditService.logAuditEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_FAILURE }),
    )
  })

  it('converts the query string into the search', async () => {
    await request(app)
      .get(searchUrl)
      .query({ user: '  found  ', roleCode: 'SOME_ROLE', groupCode: 'GROUP_A', page: '2' })

    expect(externalUserService.searchUsers).toHaveBeenCalledWith(
      expect.any(String),
      { nameFilter: 'found', role: 'SOME_ROLE', group: 'GROUP_A', status: 'ALL' },
      2,
      20,
    )
  })

  it('shows a message when there are no results', async () => {
    externalUserService.searchUsers.mockResolvedValue({ content: [], totalElements: 0, number: 0 })

    const res = await request(app).get(searchUrl)

    expect(res.text).toContain('data-qa="no-results"')
  })

  it('only offers the download to maintain oauth users who are not group managers', async () => {
    const maintainer = await request(app).get(searchUrl)
    app = buildApp([AuthRole.AUTH_GROUP_MANAGER])
    const groupManager = await request(app).get(searchUrl)

    expect(maintainer.text).toContain('data-qa="download"')
    expect(groupManager.text).not.toContain('data-qa="download"')
  })

  it('audits a failure and returns an error when the search fails', async () => {
    externalUserService.searchUsers.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(searchUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_FAILURE }),
    )
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).get(searchUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('GET external user download', () => {
  it('returns the search results as a csv attachment', async () => {
    const res = await request(app).get(downloadUrl).query({ user: 'found', status: 'ACTIVE' })

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('external-user-search.csv')
    expect(res.text).toContain('"userId","username","email"')
    expect(res.text).toContain('"EXT_USER"')
    expect(externalUserService.searchUsers).toHaveBeenCalledWith(
      expect.any(String),
      { nameFilter: 'found', role: undefined, group: undefined, status: 'ACTIVE' },
      0,
      10000,
    )
  })

  it('returns a plain text error and audits a failure when the download fails', async () => {
    externalUserService.searchUsers.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(downloadUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.DOWNLOAD_REPORT_FAILURE }),
    )
  })

  it('redirects to the auth error page without the maintain oauth users role', async () => {
    app = buildApp([AuthRole.AUTH_GROUP_MANAGER])

    const res = await request(app).get(downloadUrl)

    expect(res.headers.location).toBe('/authError')
    expect(externalUserService.searchUsers).not.toHaveBeenCalled()
  })
})
