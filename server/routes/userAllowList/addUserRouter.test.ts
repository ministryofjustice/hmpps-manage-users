import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const userAllowListService = { usernameExists: jest.fn(), addAllowListUser: jest.fn() }
const auditService = createAuditServiceMock()

const addUrl = paths.userAllowList.addUser.pattern

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MANAGE_USER_ALLOW_LIST]) =>
  appWithAllRoutes({
    services: { userAllowListService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

const generalUser = {
  username: 'fasha6v',
  email: 'jameisha@employee.zg',
  firstName: 'Derryck',
  lastName: 'Siegle',
  accessPeriod: 'ONE_MONTH',
  reason: 'for test purposes',
  approver: 'Sharlotte Muirhead',
  userType: 'GENERAL',
}

beforeEach(() => {
  flashStore = useInMemoryFlash()
  userAllowListService.usernameExists.mockResolvedValue(false)
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /user-allow-list/add', () => {
  it('renders the page', async () => {
    const res = await request(app).get(addUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Add user to allow list')
  })

  it('redirects to the auth error page without the manage user allow list role', async () => {
    app = buildApp([AuthRole.ROLES_ADMIN])

    const res = await request(app).get(addUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST /user-allow-list/add', () => {
  it('adds the user, audits and redirects to the search page', async () => {
    const res = await request(app).post(addUrl).type('form').send(generalUser)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(paths.userAllowList.search.pattern)
    expect(userAllowListService.addAllowListUser).toHaveBeenCalledWith(expect.any(String), generalUser)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.ADD_ALLOW_LIST_USER,
      who: user.username,
      subjectId: generalUser.username,
      subjectType: 'USER_ID',
      details: generalUser,
    })
  })

  it('uses no restriction and a fixed reason for a digital user', async () => {
    const digitalUser = { ...generalUser, userType: 'DIGITAL', reason: undefined }

    await request(app).post(addUrl).type('form').send(digitalUser)

    expect(userAllowListService.addAllowListUser).toHaveBeenCalledWith(expect.any(String), {
      ...digitalUser,
      accessPeriod: 'NO_RESTRICTION',
      reason: 'Digital user',
    })
  })

  it('trims whitespace from the values before adding the user', async () => {
    await request(app)
      .post(addUrl)
      .type('form')
      .send({
        ...generalUser,
        username: '  fasha6v  ',
        firstName: '  Derryck  ',
        reason: '  for test purposes  ',
      })

    expect(userAllowListService.usernameExists).toHaveBeenCalledWith(expect.any(String), 'fasha6v')
    expect(userAllowListService.addAllowListUser).toHaveBeenCalledWith(expect.any(String), generalUser)
  })

  it('does not accept values that are only whitespace', async () => {
    const res = await request(app)
      .post(addUrl)
      .type('form')
      .send({ ...generalUser, username: '   ', firstName: '   ', lastName: '   ', reason: '   ', approver: '   ' })

    expect(res.headers.location).toBe(`${addUrl}?userType=GENERAL`)
    expect(flashStore.errors).toEqual([
      { href: '#username', text: 'Enter a valid username' },
      { href: '#firstName', text: 'Enter a valid first name' },
      { href: '#lastName', text: 'Enter a valid last name' },
      { href: '#reason', text: 'Enter a valid business reason' },
      { href: '#approver', text: "Enter the approving manager's name" },
    ])
    expect(userAllowListService.usernameExists).not.toHaveBeenCalled()
    expect(userAllowListService.addAllowListUser).not.toHaveBeenCalled()
  })

  it('flashes the body and redirects back when the username already exists', async () => {
    userAllowListService.usernameExists.mockResolvedValue(true)

    const res = await request(app).post(addUrl).type('form').send(generalUser)

    expect(res.headers.location).toBe(`${addUrl}?userType=GENERAL`)
    expect(flashStore.errors).toEqual([
      { href: '#username', text: 'Username already exists, please update their access instead' },
    ])
    expect(flashStore.requestBody).toEqual([JSON.stringify(generalUser)])
    expect(userAllowListService.addAllowListUser).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('flashes an error and redirects back when the email is invalid', async () => {
    const res = await request(app)
      .post(addUrl)
      .type('form')
      .send({ ...generalUser, email: 'notanemail' })

    expect(res.headers.location).toBe(`${addUrl}?userType=GENERAL`)
    expect(flashStore.errors).toEqual([
      { href: '#email', text: 'Enter an email address in the correct format, like first.last@justice.gov.uk' },
    ])
  })

  it('returns an error when adding the user fails', async () => {
    userAllowListService.addAllowListUser.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(addUrl).type('form').send(generalUser)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
