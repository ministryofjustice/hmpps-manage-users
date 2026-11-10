import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { Page } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const externalUserService = {
  getUser: jest.fn(),
  getUserRoles: jest.fn(),
  getUserGroups: jest.fn(),
  assignableGroups: jest.fn(),
}
const auditService = createAuditServiceMock()

const userId = 'USER-ID'
const detailsUrl = paths.externalUser.manage.details({ userId })

let app: Express

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS]) =>
  appWithAllRoutes({
    services: { externalUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  useInMemoryFlash()
  externalUserService.getUser.mockResolvedValue({
    userId,
    username: 'EXT_USER',
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    enabled: true,
  })
  externalUserService.getUserRoles.mockResolvedValue([{ roleCode: 'HELD_ROLE', roleName: 'Held Role' }])
  externalUserService.getUserGroups.mockResolvedValue([
    { groupCode: 'GROUP_A', groupName: 'Group A' },
    { groupCode: 'GROUP_B', groupName: 'Group B' },
  ])
  externalUserService.assignableGroups.mockResolvedValue([{ groupCode: 'GROUP_A', groupName: 'Group A' }])
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET external user details', () => {
  it('renders the user, roles and groups and audits the page view', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Test User')
    expect(res.text).toContain('Held Role')
    expect(res.text).toContain('Group A')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_EXTERNAL_USER, {
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })
  })

  it('shows the deactivate link for an enabled user', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.text).toContain('Active account')
    expect(res.text).toContain('Deactivate account')
  })

  it('shows the activate button for a disabled user', async () => {
    externalUserService.getUser.mockResolvedValue({
      userId,
      username: 'EXT_USER',
      firstName: 'Test',
      lastName: 'User',
      enabled: false,
    })

    const res = await request(app).get(detailsUrl)

    expect(res.text).toContain('Inactive account')
    expect(res.text).toContain('data-qa="activate-button"')
  })

  it('lets maintain oauth users remove any group without fetching assignable groups', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.text).toContain('remove-button-GROUP_A')
    expect(res.text).toContain('remove-button-GROUP_B')
    expect(externalUserService.assignableGroups).not.toHaveBeenCalled()
  })

  it('lets group managers remove only the groups they can assign', async () => {
    app = buildApp([AuthRole.AUTH_GROUP_MANAGER])

    const res = await request(app).get(detailsUrl)

    expect(res.text).toContain('remove-button-GROUP_A')
    expect(res.text).not.toContain('remove-button-GROUP_B')
    expect(externalUserService.assignableGroups).toHaveBeenCalled()
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).get(detailsUrl)

    expect(res.headers.location).toBe('/authError')
  })

  it('returns an error when the user cannot be fetched', async () => {
    externalUserService.getUser.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })
})
