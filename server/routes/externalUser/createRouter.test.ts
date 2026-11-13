import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const externalUserService = { assignableGroups: jest.fn(), createExternalUser: jest.fn() }
const auditService = createAuditServiceMock()

const createUrl = paths.externalUser.create.pattern

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS]) =>
  appWithAllRoutes({
    services: { externalUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

const newUser = { email: 'newuser@justice.gov.uk', firstName: 'John', lastName: 'Doe' }

beforeEach(() => {
  flashStore = useInMemoryFlash()
  externalUserService.assignableGroups.mockResolvedValue([{ groupCode: 'SITE_1', groupName: 'Site 1' }])
  externalUserService.createExternalUser.mockResolvedValue('USER_ID')
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /create-external-user', () => {
  it('renders the page with the assignable groups', async () => {
    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Site 1')
  })

  it('redirects to the auth error page without a permitted role', async () => {
    app = buildApp([AuthRole.ROLES_ADMIN])

    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST /create-external-user', () => {
  it('creates the user, audits and renders the success page', async () => {
    const res = await request(app).post(createUrl).type('form').send(newUser)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain(newUser.email)
    expect(externalUserService.createExternalUser).toHaveBeenCalledWith(expect.any(String), {
      ...newUser,
      groupCodes: [],
    })
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.CREATE_EXTERNAL_USER,
      who: user.username,
      subjectId: 'USER_ID',
      subjectType: 'USER_ID',
      details: newUser,
    })
  })

  it('trims whitespace from the values before creating the user', async () => {
    await request(app)
      .post(createUrl)
      .type('form')
      .send({ email: '  newuser@justice.gov.uk  ', firstName: '  John  ', lastName: '  Doe  ' })

    expect(externalUserService.createExternalUser).toHaveBeenCalledWith(expect.any(String), {
      ...newUser,
      groupCodes: [],
    })
  })

  it('allows spaces in the first name and digits in the last name', async () => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...newUser, firstName: 'John Paul George', lastName: '12' })

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(externalUserService.createExternalUser).toHaveBeenCalledWith(expect.any(String), {
      ...newUser,
      firstName: 'John Paul George',
      lastName: '12',
      groupCodes: [],
    })
  })

  it('does not accept values that are only whitespace', async () => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ email: '   ', firstName: '   ', lastName: '   ' })

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([
      { href: '#email', text: 'Enter an email address' },
      { href: '#firstName', text: 'Enter a first name' },
      { href: '#lastName', text: 'Enter a last name' },
    ])
    expect(externalUserService.createExternalUser).not.toHaveBeenCalled()
  })

  it('flashes errors and redirects back when validation fails', async () => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...newUser, email: 'notanemail' })

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([
      { href: '#email', text: 'Enter an email address in the correct format, like first.last@justice.gov.uk' },
    ])
    expect(flashStore.requestBody).toEqual([JSON.stringify({ ...newUser, email: 'notanemail' })])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  describe('as an auth group manager', () => {
    beforeEach(() => {
      app = buildApp([AuthRole.AUTH_GROUP_MANAGER])
    })

    it('requires a group', async () => {
      const res = await request(app).post(createUrl).type('form').send(newUser)

      expect(res.headers.location).toBe(createUrl)
      expect(flashStore.errors).toEqual([{ href: '#groupCode', text: 'Select a group' }])
      expect(externalUserService.createExternalUser).not.toHaveBeenCalled()
    })

    it('creates the user in the selected group', async () => {
      const res = await request(app)
        .post(createUrl)
        .type('form')
        .send({ ...newUser, groupCode: 'SITE_1' })

      expect(res.status).toBe(HttpStatusCode.OK)
      expect(externalUserService.createExternalUser).toHaveBeenCalledWith(expect.any(String), {
        ...newUser,
        groupCodes: ['SITE_1'],
      })
    })
  })

  describe('when the API rejects the request', () => {
    it.each([
      [
        'a disallowed email domain',
        {
          responseStatus: HttpStatusCode.BAD_REQUEST,
          data: { userMessage: 'Bad', developerMessage: 'failed with reason: domain' },
        },
        'The email domain is not allowed. Enter a work email address',
      ],
      [
        'a bad request with a user message',
        { responseStatus: HttpStatusCode.BAD_REQUEST, data: { userMessage: 'Bad email' } },
        'Bad email',
      ],
      ['an existing email', { responseStatus: HttpStatusCode.CONFLICT }, 'Email already exists'],
    ])('flashes the error for %s and redirects back', async (_name, apiError, expectedText) => {
      externalUserService.createExternalUser.mockRejectedValue(apiError)

      const res = await request(app).post(createUrl).type('form').send(newUser)

      expect(res.headers.location).toBe(createUrl)
      expect(flashStore.errors).toEqual([{ href: '#email', text: expectedText }])
      expect(auditService.logAuditEvent).not.toHaveBeenCalled()
    })

    it('returns an error for other failures', async () => {
      externalUserService.createExternalUser.mockRejectedValue(new Error('boom'))

      const res = await request(app).post(createUrl).type('form').send(newUser)

      expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    })
  })
})
