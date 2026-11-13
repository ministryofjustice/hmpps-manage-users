import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { Page } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const dpsUserService = {
  getDpsUser: jest.fn(),
  getRoles: jest.fn(),
  getUserCaseloads: jest.fn(),
  isAdministeredBy: jest.fn(),
}
const userService = { getUserEmail: jest.fn() }
const rolesService = { getRoles: jest.fn() }
const auditService = createAuditServiceMock()

const userId = 'TESTUSER'
const detailsUrl = paths.dpsUser.manage.details({ userId })

let app: Express

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_ACCESS_ROLES]) =>
  appWithAllRoutes({
    services: { dpsUserService, userService, rolesService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  useInMemoryFlash()
  dpsUserService.getDpsUser.mockResolvedValue({
    username: userId,
    firstName: 'Test',
    lastName: 'User',
    primaryEmail: 'test.user@justice.gov.uk',
    active: true,
  })
  dpsUserService.getRoles.mockResolvedValue({
    activeCaseload: { id: 'LEI', name: 'Leeds' },
    dpsRoles: [{ code: 'HELD_ROLE', name: 'Held Role' }],
  })
  dpsUserService.getUserCaseloads.mockResolvedValue({
    caseloads: [
      { id: 'LEI', name: 'Leeds' },
      { id: 'MDI', name: 'Moorland' },
    ],
  })
  userService.getUserEmail.mockResolvedValue({ email: 'test.user@justice.gov.uk', verified: true })
  rolesService.getRoles.mockResolvedValue([])
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET DPS user details', () => {
  it('renders the user, roles and caseloads and audits the page view', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Test User')
    expect(res.text).toContain('Held Role')
    expect(res.text).toContain('Moorland')
    expect(dpsUserService.getDpsUser).toHaveBeenCalledWith(expect.any(String), userId, true)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_DPS_USER, {
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })
  })

  it('does not show an email change when the email is verified', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.text).not.toContain('Email change awaiting verification')
  })

  it('shows an email change awaiting verification', async () => {
    userService.getUserEmail.mockResolvedValue({ email: 'new.email@justice.gov.uk', verified: false })

    const res = await request(app).get(detailsUrl)

    expect(res.text).toContain('Email change awaiting verification')
    expect(res.text).toContain('new.email@justice.gov.uk')
  })

  it('shows the change email link to a local administrator of a general user', async () => {
    dpsUserService.getDpsUser.mockResolvedValue({ username: userId, accountType: 'GENERAL', active: true })
    dpsUserService.isAdministeredBy.mockResolvedValue(true)

    const res = await request(app).get(detailsUrl)

    expect(dpsUserService.isAdministeredBy).toHaveBeenCalledWith(expect.any(String), userId)
    expect(res.text).toContain('/change-email')
  })

  it('hides the change email link when the user is not administered by the local administrator', async () => {
    dpsUserService.getDpsUser.mockResolvedValue({ username: userId, accountType: 'GENERAL', active: true })
    dpsUserService.isAdministeredBy.mockResolvedValue(false)

    const res = await request(app).get(detailsUrl)

    expect(res.text).not.toContain('/change-email')
  })

  it('only shows the remove caseload button to maintain access roles admins', async () => {
    const standard = await request(app).get(detailsUrl)
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN])
    const admin = await request(app).get(detailsUrl)

    expect(standard.text).not.toContain('remove-button-MDI')
    expect(admin.text).toContain('remove-button-MDI')
  })

  it('offers role removal requests only for restricted roles', async () => {
    rolesService.getRoles.mockImplementation(async (_token: string, adminType: string) =>
      adminType === 'IMS_HIDDEN' ? [{ roleCode: 'HELD_ROLE' }] : [],
    )

    const res = await request(app).get(detailsUrl)

    expect(res.text).toContain('request-removal-HELD_ROLE')
  })

  it('does not offer role removal requests for unrestricted roles', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.text).not.toContain('request-removal-HELD_ROLE')
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(detailsUrl)

    expect(res.headers.location).toBe('/authError')
  })

  it('returns an error when the user cannot be fetched', async () => {
    dpsUserService.getDpsUser.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })
})
