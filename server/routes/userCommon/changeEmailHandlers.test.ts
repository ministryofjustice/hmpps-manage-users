import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const dpsUserService = { getDpsUser: jest.fn(), changeEmail: jest.fn(), isAdministeredBy: jest.fn() }
const externalUserService = { getUser: jest.fn(), changeEmail: jest.fn() }
const userService = { getUserEmail: jest.fn() }
const auditService = createAuditServiceMock()

const userId = 'USER1'

// both routers share the same handlers, so run the same suite against each
const variants = [
  {
    name: 'DPS user',
    role: AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN,
    changeUrl: paths.dpsUser.manage.changeEmail({ userId }),
    successUrl: paths.dpsUser.manage.changeEmailSuccess({ userId }),
    changeEmailMock: dpsUserService.changeEmail,
  },
  {
    name: 'external user',
    role: AuthRole.MAINTAIN_OAUTH_USERS,
    changeUrl: paths.externalUser.manage.changeEmail({ userId }),
    successUrl: paths.externalUser.manage.changeEmailSuccess({ userId }),
    changeEmailMock: externalUserService.changeEmail,
  },
]

const expectAuditEvents = (...events: EventType[]) => {
  const calls = auditService.logAuditEvent.mock.calls.map(([event]) => event)
  expect(calls.map(event => event.what)).toEqual(events)
  calls.forEach(event =>
    expect(event).toEqual({
      what: event.what,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { email: expect.any(String) },
      correlationId: calls[0].correlationId,
    }),
  )
  expect(calls[0].correlationId).toEqual(expect.any(String))
}

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[]) =>
  appWithAllRoutes({
    services: { dpsUserService, externalUserService, userService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  dpsUserService.getDpsUser.mockResolvedValue({ username: userId, firstName: 'Some', lastName: 'User' })
  userService.getUserEmail.mockResolvedValue({ email: 'current@justice.gov.uk' })
  externalUserService.getUser.mockResolvedValue({
    username: userId,
    firstName: 'Some',
    lastName: 'User',
    email: 'current@justice.gov.uk',
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('DPS user email change by a local administrator', () => {
  const { changeUrl, successUrl } = variants[0]

  beforeEach(() => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])
    dpsUserService.getDpsUser.mockResolvedValue({ username: userId, accountType: 'GENERAL' })
  })

  it('allows the change for a user they administer', async () => {
    dpsUserService.isAdministeredBy.mockResolvedValue(true)

    const res = await request(app).post(changeUrl).type('form').send({ email: 'new@justice.gov.uk' })

    expect(res.headers.location).toBe(successUrl)
    expect(dpsUserService.changeEmail).toHaveBeenCalledWith(expect.any(String), userId, 'new@justice.gov.uk')
  })

  it('redirects to the auth error page for a user they do not administer', async () => {
    dpsUserService.isAdministeredBy.mockResolvedValue(false)

    const res = await request(app).get(changeUrl)

    expect(res.headers.location).toBe('/authError')
  })

  it('does not allow the change for an admin account', async () => {
    dpsUserService.getDpsUser.mockResolvedValue({ username: userId, accountType: 'ADMIN' })

    const res = await request(app).post(changeUrl).type('form').send({ email: 'new@justice.gov.uk' })

    expect(res.headers.location).toBe('/authError')
    expect(dpsUserService.changeEmail).not.toHaveBeenCalled()
  })
})

describe.each(variants)('change $name email', ({ role, changeUrl, successUrl, changeEmailMock }) => {
  beforeEach(() => {
    app = buildApp([role])
  })

  describe('GET', () => {
    it('renders the page with the current email', async () => {
      const res = await request(app).get(changeUrl)

      expect(res.status).toBe(HttpStatusCode.OK)
      expect(res.text).toContain('current@justice.gov.uk')
    })

    it('redirects to the auth error page without the required role', async () => {
      app = buildApp([AuthRole.ROLES_ADMIN])

      const res = await request(app).get(changeUrl)

      expect(res.status).toBe(HttpStatusCode.FOUND)
      expect(res.headers.location).toBe('/authError')
    })
  })

  describe('POST', () => {
    it('changes the email, audits and redirects to the success page', async () => {
      const res = await request(app).post(changeUrl).type('form').send({ email: 'new@justice.gov.uk' })

      expect(res.status).toBe(HttpStatusCode.FOUND)
      expect(res.headers.location).toBe(successUrl)
      expect(changeEmailMock).toHaveBeenCalledWith(expect.any(String), userId, 'new@justice.gov.uk')
      expect(auditService.logAuditEvent).toHaveBeenCalledTimes(2)
      expectAuditEvents(EventType.EDIT_USER_EMAIL_ADDRESS_ATTEMPT, EventType.EDIT_USER_EMAIL_ADDRESS_SUCCESS)
    })

    it('trims whitespace from the email before changing it', async () => {
      await request(app).post(changeUrl).type('form').send({ email: '  new@justice.gov.uk  ' })

      expect(changeEmailMock).toHaveBeenCalledWith(expect.any(String), userId, 'new@justice.gov.uk')
    })

    it('does not accept an email that is only whitespace', async () => {
      const res = await request(app).post(changeUrl).type('form').send({ email: '     ' })

      expect(res.headers.location).toBe(changeUrl)
      expect(flashStore.errors).toEqual([{ href: '#email', text: 'Enter an email address' }])
      expect(changeEmailMock).not.toHaveBeenCalled()
    })

    it('flashes errors and redirects back when validation fails', async () => {
      const res = await request(app).post(changeUrl).type('form').send({ email: 'notanemail' })

      expect(res.headers.location).toBe(changeUrl)
      expect(flashStore.errors).toEqual([
        { href: '#email', text: 'Enter an email address in the correct format, like first.last@justice.gov.uk' },
      ])
      expect(changeEmailMock).not.toHaveBeenCalled()
      expect(auditService.logAuditEvent).not.toHaveBeenCalled()
    })

    it('flashes the API error and redirects back on a bad request', async () => {
      changeEmailMock.mockRejectedValue({
        responseStatus: HttpStatusCode.BAD_REQUEST,
        data: { userMessage: 'Bad', developerMessage: 'failed with reason: domain' },
      })

      const res = await request(app).post(changeUrl).type('form').send({ email: 'new@example.com' })

      expect(res.headers.location).toBe(changeUrl)
      expect(flashStore.errors).toEqual([
        { href: '#email', text: 'The email domain is not allowed. Enter a work email address' },
      ])
      expectAuditEvents(EventType.EDIT_USER_EMAIL_ADDRESS_ATTEMPT, EventType.EDIT_USER_EMAIL_ADDRESS_FAILURE)
    })

    it('returns an error for other API failures', async () => {
      changeEmailMock.mockRejectedValue(new Error('boom'))

      const res = await request(app).post(changeUrl).type('form').send({ email: 'new@justice.gov.uk' })

      expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      expectAuditEvents(EventType.EDIT_USER_EMAIL_ADDRESS_ATTEMPT, EventType.EDIT_USER_EMAIL_ADDRESS_FAILURE)
    })
  })
})
