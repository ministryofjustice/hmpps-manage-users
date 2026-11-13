import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { Page } from '../audit'
import paginationService from '../../services/paginationService'
import { HttpStatusCode } from '../../utils/utils'

const rolesService = { getPagedRoles: jest.fn(), getRoleDetails: jest.fn() }
const auditService = createAuditServiceMock()

const listUrl = paths.roles.list.pattern
const role = {
  roleCode: 'TEST_ROLE',
  roleName: 'Test Role',
  roleDescription: 'A description',
  adminType: [{ adminTypeCode: 'EXT_ADM', adminTypeName: 'External Administrator' }],
}
const detailsUrl = paths.roles.details({ role: role.roleCode })

let app: Express

const buildApp = (roles: string[] = [AuthRole.ROLES_ADMIN]) =>
  appWithAllRoutes({
    services: { rolesService, auditService, paginationService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  useInMemoryFlash()
  rolesService.getPagedRoles.mockResolvedValue({ content: [role], totalElements: 1, number: 0 })
  rolesService.getRoleDetails.mockResolvedValue(role)
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET role list', () => {
  it('renders the page and audits the page view', async () => {
    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Manage roles')
    expect(res.text).toContain('Test Role')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_ROLE_LIST, {
      who: user.username,
      details: { adminType: 'ALL', page: 0 },
    })
  })

  it('searches for all admin types and the first page by default', async () => {
    await request(app).get(listUrl)

    expect(rolesService.getPagedRoles).toHaveBeenCalledWith(expect.any(String), {
      adminType: 'ALL',
      adminTypes: [],
      page: 0,
      size: 20,
    })
  })

  it('passes the filter and page from the query string to the search', async () => {
    await request(app).get(listUrl).query({ roleName: 'Test', adminType: 'DPS_ADM', page: '2' })

    expect(rolesService.getPagedRoles).toHaveBeenCalledWith(expect.any(String), {
      roleName: 'Test',
      adminType: 'DPS_ADM',
      adminTypes: ['DPS_ADM'],
      page: 2,
      size: 20,
    })
  })

  it('accepts the view administrable user roles role', async () => {
    app = buildApp([AuthRole.VIEW_ADMINISTRABLE_USER_ROLES])

    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(listUrl)

    expect(res.headers.location).toBe('/authError')
  })

  it('returns an error when the search fails', async () => {
    rolesService.getPagedRoles.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })
})

describe('GET role details', () => {
  it('renders the page and audits the page view', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Test Role')
    expect(res.text).toContain('A description')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_ROLE_DETAILS, {
      who: user.username,
      subjectId: role.roleCode,
      subjectType: 'ROLE_CODE',
    })
  })

  it('only shows the change links to roles admins', async () => {
    const admin = await request(app).get(detailsUrl)
    app = buildApp([AuthRole.VIEW_ADMINISTRABLE_USER_ROLES])
    const viewer = await request(app).get(detailsUrl)

    expect(admin.text).toContain('data-qa="change-role-name-link"')
    expect(viewer.text).not.toContain('data-qa="change-role-name-link"')
  })

  it('redirects to the role list when the role cannot be found', async () => {
    rolesService.getRoleDetails.mockRejectedValue(new Error('not found'))

    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(listUrl)
  })
})
