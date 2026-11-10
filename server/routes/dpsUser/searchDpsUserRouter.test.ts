import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import paginationService from '../../services/paginationService'
import { HttpStatusCode } from '../../utils/utils'

const dpsUserService = {
  dpsUserSearch: jest.fn(),
  getCaseloads: jest.fn(),
  downloadUserSearch: jest.fn(),
  downloadLsaSearch: jest.fn(),
}
const rolesService = { getRolesForMaintainAccessRolesUser: jest.fn() }
const auditService = createAuditServiceMock()

const searchUrl = paths.dpsUser.search.pattern
const downloadUrl = paths.dpsUser.download.pattern
const downloadLsaUrl = paths.dpsUser.downloadLsa.pattern

const searchResult = {
  username: 'FOUNDUSER',
  firstName: 'Found',
  lastName: 'Person',
  email: 'found.person@justice.gov.uk',
  status: 'OPEN',
  roles: [],
}

let app: Express

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_ACCESS_ROLES]) =>
  appWithAllRoutes({
    services: { dpsUserService, rolesService, auditService, paginationService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  useInMemoryFlash()
  dpsUserService.dpsUserSearch.mockResolvedValue({ content: [searchResult], totalElements: 1, number: 0 })
  dpsUserService.getCaseloads.mockResolvedValue([{ id: 'LEI', name: 'Leeds' }])
  dpsUserService.downloadUserSearch.mockResolvedValue([
    {
      staffId: 1,
      username: 'FOUNDUSER',
      firstName: 'Found',
      lastName: 'Person',
      activeCaseload: { id: 'LEI' },
      status: 'OPEN',
      locked: false,
      expired: false,
      active: true,
      email: 'found.person@justice.gov.uk',
      dpsRoleCount: 2,
    },
  ])
  dpsUserService.downloadLsaSearch.mockResolvedValue([
    {
      staffId: 1,
      username: 'FOUNDUSER',
      firstName: 'Found',
      lastName: 'Person',
      activeCaseload: { id: 'LEI' },
      email: 'found.person@justice.gov.uk',
      dpsRoleCount: 2,
      groups: [
        { id: 'MDI', name: 'Moorland' },
        { id: 'LEI', name: 'Leeds' },
      ],
    },
  ])
  rolesService.getRolesForMaintainAccessRolesUser.mockResolvedValue([{ roleCode: 'SOME_ROLE', roleName: 'Some Role' }])
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET DPS user search', () => {
  it('renders the results and audits the search attempt', async () => {
    const res = await request(app).get(searchUrl).query({ user: 'found' })

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('data-qa="edit-button-FOUNDUSER"')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_ATTEMPT, who: user.username }),
    )
    expect(auditService.logAuditEvent).not.toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_FAILURE }),
    )
  })

  it('converts the query string into the search query', async () => {
    await request(app).get(searchUrl).query({ user: '  found  ', groupCode: 'LEI', roleCode: 'SOME_ROLE', page: '1' })

    expect(dpsUserService.dpsUserSearch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        nameFilter: 'found',
        caseload: 'LEI',
        activeCaseload: 'LEI',
        accessRoles: ['SOME_ROLE'],
        status: 'ALL',
        page: 1,
        size: 20,
      }),
    )
  })

  it('does not restrict to the active caseload when asked not to', async () => {
    await request(app).get(searchUrl).query({ groupCode: 'LEI', restrictToActiveGroup: 'false' })

    expect(dpsUserService.dpsUserSearch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ caseload: 'LEI', activeCaseload: undefined }),
    )
  })

  it('shows a message when there are no results', async () => {
    dpsUserService.dpsUserSearch.mockResolvedValue({ content: [], totalElements: 0, number: 0 })

    const res = await request(app).get(searchUrl)

    expect(res.text).toContain('data-qa="no-results"')
  })

  it('only offers the download to users allowed to download', async () => {
    const standard = await request(app).get(searchUrl)
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN])
    const admin = await request(app).get(searchUrl)

    expect(standard.text).not.toContain('data-qa="download"')
    expect(admin.text).toContain('data-qa="download"')
  })

  it('audits a failure and returns an error when the search fails', async () => {
    dpsUserService.dpsUserSearch.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(searchUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.SEARCH_USER_FAILURE }),
    )
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(searchUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('GET DPS user download', () => {
  beforeEach(() => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN])
  })

  it('returns the search results as a csv attachment', async () => {
    const res = await request(app).get(downloadUrl).query({ user: 'found' })

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('user-search.csv')
    expect(res.text).toContain('"staffId","username","firstName"')
    expect(res.text).toContain('"FOUNDUSER"')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.DOWNLOAD_REPORT_ATTEMPT }),
    )
  })

  it('returns a plain text error and audits a failure when the download fails', async () => {
    dpsUserService.downloadUserSearch.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(downloadUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.DOWNLOAD_REPORT_FAILURE }),
    )
  })

  it('redirects to the auth error page without the admin role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).get(downloadUrl)

    expect(res.headers.location).toBe('/authError')
    expect(dpsUserService.downloadUserSearch).not.toHaveBeenCalled()
  })
})

describe('GET DPS LSA download', () => {
  beforeEach(() => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN])
  })

  it('returns one csv row per LSA caseload', async () => {
    const res = await request(app).get(downloadLsaUrl).query({ showOnlyLSAs: 'true' })

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.headers['content-disposition']).toContain('lsa-report.csv')
    expect(res.text).toContain('"Moorland"')
    expect(res.text).toContain('"Leeds"')
    expect(res.text.trim().split('\n')).toHaveLength(3)
  })

  it('redirects to the auth error page without the admin role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).get(downloadLsaUrl)

    expect(res.headers.location).toBe('/authError')
    expect(dpsUserService.downloadLsaSearch).not.toHaveBeenCalled()
  })
})
