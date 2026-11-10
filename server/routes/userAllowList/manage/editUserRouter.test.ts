import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const userAllowListService = { getAllowListUser: jest.fn(), updateAllowListUserAccess: jest.fn() }
const auditService = createAuditServiceMock()

const username = 'fasha6v'
const editUrl = paths.userAllowList.manage.edit({ username })

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MANAGE_USER_ALLOW_LIST]) =>
  appWithAllRoutes({
    services: { userAllowListService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

const form = { id: 'ID1', reason: 'for test purposes', accessPeriod: 'ONE_MONTH' }

beforeEach(() => {
  flashStore = useInMemoryFlash()
  userAllowListService.getAllowListUser.mockResolvedValue({
    id: 'ID1',
    username,
    email: 'jameisha@employee.zg',
    firstName: 'Derryck',
    lastName: 'Siegle',
    userType: 'GENERAL',
    approver: 'Sharlotte Muirhead',
    reason: 'existing reason',
    allowlistEndDate: '2099-01-01',
  })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET edit allow list user', () => {
  it('renders the page with the user', async () => {
    const res = await request(app).get(editUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Derryck')
    expect(res.text).toContain('existing reason')
  })

  it('redirects to the auth error page without the manage user allow list role', async () => {
    app = buildApp([AuthRole.ROLES_ADMIN])

    const res = await request(app).get(editUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST edit allow list user', () => {
  it('updates the access, audits and redirects to the view page', async () => {
    const res = await request(app).post(editUrl).type('form').send(form)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(paths.userAllowList.manage.view({ username }))
    expect(userAllowListService.updateAllowListUserAccess).toHaveBeenCalledWith(expect.any(String), 'ID1', {
      reason: 'for test purposes',
      accessPeriod: 'ONE_MONTH',
    })
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.UPDATE_ALLOW_LIST_USER,
      who: user.username,
      subjectId: 'ID1',
      subjectType: 'USER_ID',
      details: form,
    })
  })

  it('trims whitespace from the reason before updating', async () => {
    await request(app)
      .post(editUrl)
      .type('form')
      .send({ ...form, reason: '  for test purposes  ' })

    expect(userAllowListService.updateAllowListUserAccess).toHaveBeenCalledWith(expect.any(String), 'ID1', {
      reason: 'for test purposes',
      accessPeriod: 'ONE_MONTH',
    })
  })

  it('does not accept a reason that is only whitespace', async () => {
    const res = await request(app)
      .post(editUrl)
      .type('form')
      .send({ ...form, reason: '     ' })

    expect(res.headers.location).toBe(editUrl)
    expect(flashStore.errors).toEqual([{ href: '#reason', text: 'Enter a valid business reason' }])
    expect(userAllowListService.updateAllowListUserAccess).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error when updating fails', async () => {
    userAllowListService.updateAllowListUserAccess.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(editUrl).type('form').send(form)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
