import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const dpsUserService = { getCaseloads: jest.fn(), createDpsUser: jest.fn() }
const auditService = createAuditServiceMock()

const createUrl = paths.dpsUser.createDpsUser.pattern

const validForm = {
  userType: 'DPS_GEN',
  username: 'NEWUSER',
  email: 'new.user@justice.gov.uk',
  firstName: 'Jane',
  lastName: 'Smith',
  defaultCaseloadId: 'MDI',
}

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.CREATE_USER]) =>
  appWithAllRoutes({
    services: { dpsUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  dpsUserService.getCaseloads.mockResolvedValue([])
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET create DPS user', () => {
  it('redirects to the select user type page when no user type has been chosen', async () => {
    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(paths.dpsUser.createUser.pattern)
    expect(dpsUserService.getCaseloads).not.toHaveBeenCalled()
  })

  it('redirects to the auth error page without the create user role', async () => {
    app = buildApp(['ROLE_OTHER'])

    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST create DPS user', () => {
  it('creates the user, audits and renders the success page', async () => {
    dpsUserService.createDpsUser.mockResolvedValue({ username: 'NEWUSER', primaryEmail: validForm.email })

    const res = await request(app).post(createUrl).type('form').send(validForm)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('DPS user created')
    expect(res.text).toContain('NEWUSER')
    expect(dpsUserService.createDpsUser).toHaveBeenCalledWith(expect.any(String), validForm)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.CREATE_DPS_USER,
      who: user.username,
      subjectId: 'NEWUSER',
      subjectType: 'USER_ID',
      details: validForm,
    })
  })

  it('trims whitespace from the form values before creating the user', async () => {
    dpsUserService.createDpsUser.mockResolvedValue({ username: 'NEWUSER', primaryEmail: validForm.email })

    await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...validForm, username: '  NEWUSER  ', email: `  ${validForm.email}  `, firstName: '  Jane  ' })

    expect(dpsUserService.createDpsUser).toHaveBeenCalledWith(expect.any(String), validForm)
  })

  it('replaces forward apostrophes in the names before validating and creating the user', async () => {
    dpsUserService.createDpsUser.mockResolvedValue({ username: 'NEWUSER', primaryEmail: validForm.email })

    await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...validForm, firstName: 'D’Arcy', lastName: 'O’Brien' })

    expect(dpsUserService.createDpsUser).toHaveBeenCalledWith(expect.any(String), {
      ...validForm,
      firstName: "D'Arcy",
      lastName: "O'Brien",
    })
  })

  it('does not require a caseload for a central admin', async () => {
    const adminForm = { ...validForm, userType: 'DPS_ADM', defaultCaseloadId: undefined }
    dpsUserService.createDpsUser.mockResolvedValue({ username: 'NEWUSER', primaryEmail: validForm.email })

    const res = await request(app).post(createUrl).type('form').send(adminForm)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(dpsUserService.createDpsUser).toHaveBeenCalled()
  })

  it.each([
    { userType: 'DPS_GEN', text: 'Select a default caseload' },
    { userType: 'DPS_LSA', text: 'Select a default local admin group' },
  ])('requires a default caseload for $userType', async ({ userType, text }) => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...validForm, userType, defaultCaseloadId: '--' })

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([{ href: '#defaultCaseloadId', text }])
    expect(dpsUserService.createDpsUser).not.toHaveBeenCalled()
  })

  it('does not accept values that are only whitespace', async () => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...validForm, username: '   ', email: '   ', firstName: '   ', lastName: '   ' })

    expect(res.headers.location).toBe(createUrl)
    const errors = flashStore.errors as { href: string }[]
    expect(errors.map(error => error.href)).toEqual(['#username', '#email', '#firstName', '#lastName'])
    expect(dpsUserService.createDpsUser).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'a bad request',
      error: { responseStatus: HttpStatusCode.BAD_REQUEST, data: { userMessage: 'Bad user' } },
      expected: { text: 'Bad user' },
    },
    {
      name: 'a bad request without a message',
      error: { responseStatus: HttpStatusCode.BAD_REQUEST, data: {} },
      expected: { text: 'Unable to create DPS user' },
    },
    {
      name: 'an existing username',
      error: { responseStatus: HttpStatusCode.CONFLICT, data: { errorCode: 601 } },
      expected: { href: '#username', text: 'Username already exists' },
    },
    {
      name: 'an invalid email domain',
      error: { responseStatus: HttpStatusCode.CONFLICT, data: { errorCode: 602 } },
      expected: { href: '#email', text: 'Invalid Email domain' },
    },
  ])('flashes the error and redirects back for $name', async ({ error, expected }) => {
    dpsUserService.createDpsUser.mockRejectedValue(error)

    const res = await request(app).post(createUrl).type('form').send(validForm)

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([expected])
    expect(flashStore.requestBody).toEqual([JSON.stringify(validForm)])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    dpsUserService.createDpsUser.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(createUrl).type('form').send(validForm)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
