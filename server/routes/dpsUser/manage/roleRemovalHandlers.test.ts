import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const dpsUserService = { removeRole: jest.fn(), getDpsUser: jest.fn() }
const rolesService = { getRoles: jest.fn() }
const auditService = createAuditServiceMock()

const userId = 'TESTUSER'
const role = 'SOME_ROLE'
const removeUrl = paths.dpsUser.manage.roles.remove({ userId, role })
const requestRemovalUrl = paths.dpsUser.manage.roles.requestRemoval({ userId, role })
const detailsUrl = paths.dpsUser.manage.details({ userId })

let app: Express

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_ACCESS_ROLES]) =>
  appWithAllRoutes({
    services: { dpsUserService, rolesService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('POST remove role from DPS user', () => {
  it('removes the role, audits and redirects to the user details', async () => {
    const res = await request(app).post(removeUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(dpsUserService.removeRole).toHaveBeenCalledWith(expect.any(String), userId, role)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.REMOVE_USER_ROLE,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { role },
    })
  })

  it('redirects without auditing when the role has already been removed', async () => {
    dpsUserService.removeRole.mockRejectedValue({ responseStatus: HttpStatusCode.BAD_REQUEST })

    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe(detailsUrl)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    dpsUserService.removeRole.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(removeUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })

  it('redirects to the auth error page without a maintain access roles role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe('/authError')
    expect(dpsUserService.removeRole).not.toHaveBeenCalled()
  })
})

describe('GET request DPS role removal', () => {
  beforeEach(() => {
    dpsUserService.getDpsUser.mockResolvedValue({ username: user.username, administratorOfUserGroups: [] })
    rolesService.getRoles.mockResolvedValue([])
  })

  it('renders the page', async () => {
    const res = await request(app).get(requestRemovalUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Request role removal')
  })

  it('shows the removal message for an IMS restricted role', async () => {
    rolesService.getRoles.mockImplementation(async (_token: string, adminType: string) =>
      adminType === 'IMS_HIDDEN' ? [{ roleCode: role }] : [],
    )

    const res = await request(app).get(requestRemovalUrl)

    expect(res.text).toContain('Intelligence Management Service')
  })

  it('redirects to the auth error page without a maintain access roles role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(requestRemovalUrl)

    expect(res.headers.location).toBe('/authError')
  })
})
