import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const dpsUserService = { removeCaseload: jest.fn() }
const auditService = createAuditServiceMock()

const userId = 'TESTUSER'
const caseload = 'MDI'
const removeUrl = paths.dpsUser.manage.removeCaseload({ userId, caseload })
const detailsUrl = paths.dpsUser.manage.details({ userId })

let app: Express

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_ACCESS_ROLES]) =>
  appWithAllRoutes({
    services: { dpsUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('POST remove caseload from DPS user', () => {
  it('removes the caseload, audits and redirects to the user details', async () => {
    const res = await request(app).post(removeUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(dpsUserService.removeCaseload).toHaveBeenCalledWith(expect.any(String), userId, caseload)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.REMOVE_USER_CASELOAD,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { caseload },
    })
  })

  it.each([HttpStatusCode.BAD_REQUEST, HttpStatusCode.NOT_FOUND])(
    'redirects to the user details without auditing when the API returns %s',
    async responseStatus => {
      dpsUserService.removeCaseload.mockRejectedValue({ responseStatus })

      const res = await request(app).post(removeUrl)

      expect(res.headers.location).toBe(detailsUrl)
      expect(auditService.logAuditEvent).not.toHaveBeenCalled()
    },
  )

  it('returns an error for other API failures', async () => {
    dpsUserService.removeCaseload.mockRejectedValue({ responseStatus: HttpStatusCode.INTERNAL_SERVER_ERROR })

    const res = await request(app).post(removeUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for non API errors', async () => {
    dpsUserService.removeCaseload.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(removeUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })

  it('redirects to the auth error page without a maintain access roles role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).post(removeUrl)

    expect(res.headers.location).toBe('/authError')
    expect(dpsUserService.removeCaseload).not.toHaveBeenCalled()
  })
})
