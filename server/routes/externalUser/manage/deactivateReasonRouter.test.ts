import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const externalUserService = { getUser: jest.fn(), deactivateUser: jest.fn() }
const auditService = createAuditServiceMock()

const userId = 'USER-ID'
const reasonUrl = paths.externalUser.manage.deactivateReason({ userId })
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
  externalUserService.getUser.mockResolvedValue({ userId, firstName: 'Test', lastName: 'User' })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET deactivate external user reason', () => {
  it('renders the page', async () => {
    const res = await request(app).get(reasonUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Deactivate account')
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).get(reasonUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST deactivate external user reason', () => {
  it('deactivates the user, audits and redirects to the user details', async () => {
    const res = await request(app).post(reasonUrl).type('form').send({ reason: 'No longer needed' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(externalUserService.deactivateUser).toHaveBeenCalledWith(expect.any(String), userId, 'No longer needed')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.DEACTIVATE_USER,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { reason: 'No longer needed' },
    })
  })

  it('trims whitespace from the reason', async () => {
    await request(app).post(reasonUrl).type('form').send({ reason: '  No longer needed  ' })

    expect(externalUserService.deactivateUser).toHaveBeenCalledWith(expect.any(String), userId, 'No longer needed')
  })

  it.each(['', '   ', 'ab', '  ab  '])('flashes an error and redirects back for the reason %p', async reason => {
    const res = await request(app).post(reasonUrl).type('form').send({ reason })

    expect(res.headers.location).toBe(reasonUrl)
    expect(flashStore.errors).toEqual([
      { href: '#reason', text: 'Enter the reason for deactivating the account (minimum 3 characters)' },
    ])
    expect(externalUserService.deactivateUser).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('flashes an error and redirects back when the user is not in a managed group', async () => {
    externalUserService.deactivateUser.mockRejectedValue({ responseStatus: HttpStatusCode.FORBIDDEN })

    const res = await request(app).post(reasonUrl).type('form').send({ reason: 'No longer needed' })

    expect(res.headers.location).toBe(reasonUrl)
    expect(flashStore.errors).toEqual([
      {
        href: '#reason',
        text: 'You are not able to maintain this user, user does not belong to any groups you manage',
      },
    ])
    expect(flashStore.requestBody).toContain(JSON.stringify({ reason: 'No longer needed' }))
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    externalUserService.deactivateUser.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(reasonUrl).type('form').send({ reason: 'No longer needed' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
