import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const externalUserService = {
  enableUser: jest.fn(),
  disableUser: jest.fn(),
  removeRole: jest.fn(),
  removeGroup: jest.fn(),
}
const auditService = createAuditServiceMock()

const userId = 'USER-ID'
const detailsUrl = paths.externalUser.manage.details({ userId })

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS]) =>
  appWithAllRoutes({
    services: { externalUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe.each([
  {
    name: 'activate',
    url: paths.externalUser.manage.activate({ userId }),
    action: externalUserService.enableUser,
    event: EventType.ENABLE_USER,
  },
  {
    name: 'deactivate',
    url: paths.externalUser.manage.deactivate({ userId }),
    action: externalUserService.disableUser,
    event: EventType.DISABLE_USER,
  },
])('POST $name external user', ({ url, action, event }) => {
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

  it('accepts the auth group manager role', async () => {
    app = buildApp([AuthRole.AUTH_GROUP_MANAGER])

    const res = await request(app).post(url)

    expect(res.headers.location).toBe(detailsUrl)
    expect(action).toHaveBeenCalled()
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).post(url)

    expect(res.headers.location).toBe('/authError')
    expect(action).not.toHaveBeenCalled()
  })

  it('returns an error when the action fails', async () => {
    action.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(url)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})

describe('POST remove role from external user', () => {
  const role = 'SOME_ROLE'
  const removeUrl = paths.externalUser.manage.roles.remove({ userId, role })

  it('removes the role, audits and redirects to the user details', async () => {
    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe(detailsUrl)
    expect(externalUserService.removeRole).toHaveBeenCalledWith(expect.any(String), userId, role)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.REMOVE_USER_ROLE,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { role },
    })
  })

  it('redirects without auditing when the role has already been removed', async () => {
    externalUserService.removeRole.mockRejectedValue({ responseStatus: HttpStatusCode.BAD_REQUEST })

    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe(detailsUrl)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    externalUserService.removeRole.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(removeUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe('/authError')
    expect(externalUserService.removeRole).not.toHaveBeenCalled()
  })
})

describe('POST remove group from external user', () => {
  const group = 'SOME_GROUP'
  const removeUrl = paths.externalUser.manage.groups.remove({ userId, group })

  it('removes the group, audits and redirects to the user details', async () => {
    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe(detailsUrl)
    expect(externalUserService.removeGroup).toHaveBeenCalledWith(expect.any(String), userId, group)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.REMOVE_USER_GROUP,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { group },
    })
    expect(flashStore.errors).toBeUndefined()
  })

  it('flashes an error and redirects when removing the last group is forbidden', async () => {
    externalUserService.removeGroup.mockRejectedValue({ responseStatus: HttpStatusCode.FORBIDDEN })

    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe(detailsUrl)
    expect(flashStore.errors).toEqual([
      {
        href: '#groups',
        text: 'You are not allowed to remove the last group from this user, please deactivate their account instead',
      },
    ])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    externalUserService.removeGroup.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(removeUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe('/authError')
    expect(externalUserService.removeGroup).not.toHaveBeenCalled()
  })
})
