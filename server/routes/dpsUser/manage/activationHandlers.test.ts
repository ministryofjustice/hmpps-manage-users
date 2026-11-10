import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const dpsUserService = { enableUser: jest.fn(), disableUser: jest.fn() }
const auditService = createAuditServiceMock()

const userId = 'TESTUSER'
const detailsUrl = paths.dpsUser.manage.details({ userId })

const variants = [
  {
    name: 'activate',
    url: paths.dpsUser.manage.activate({ userId }),
    action: dpsUserService.enableUser,
    event: EventType.ENABLE_USER,
  },
  {
    name: 'deactivate',
    url: paths.dpsUser.manage.deactivate({ userId }),
    action: dpsUserService.disableUser,
    event: EventType.DISABLE_USER,
  },
]

let app: Express

const buildApp = (roles: string[]) =>
  appWithAllRoutes({
    services: { dpsUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES, AuthRole.MANAGE_NOMIS_USER_ACCOUNT])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe.each(variants)('POST $name DPS user', ({ url, action, event }) => {
  it('performs the action, audits and redirects to the user details', async () => {
    const res = await request(app).post(url)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(action).toHaveBeenCalledWith(expect.any(String), userId)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: event,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })
  })

  it('accepts the maintain access roles admin role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN, AuthRole.MANAGE_NOMIS_USER_ACCOUNT])

    const res = await request(app).post(url)

    expect(res.headers.location).toBe(detailsUrl)
    expect(action).toHaveBeenCalled()
  })

  it.each([
    ['manage nomis user account', [AuthRole.MAINTAIN_ACCESS_ROLES]],
    ['maintain access roles', [AuthRole.MANAGE_NOMIS_USER_ACCOUNT]],
  ])('redirects to the auth error page without the %s role', async (_name, roles) => {
    app = buildApp(roles)

    const res = await request(app).post(url)

    expect(res.headers.location).toBe('/authError')
    expect(action).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error when the action fails', async () => {
    action.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(url)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
