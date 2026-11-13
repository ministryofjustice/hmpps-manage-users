import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const dpsUserService = { getDpsUser: jest.fn(), getRoles: jest.fn(), addRoles: jest.fn() }
const rolesService = { getAssignableRoles: jest.fn(), getBannerMessage: jest.fn() }
const auditService = createAuditServiceMock()

const userId = 'TESTUSER'
const selectUrl = paths.dpsUser.manage.selectRoles({ userId })
const detailsUrl = paths.dpsUser.manage.details({ userId })

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_ACCESS_ROLES]) =>
  appWithAllRoutes({
    services: { dpsUserService, rolesService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  dpsUserService.getDpsUser.mockResolvedValue({ username: userId, firstName: 'Test', lastName: 'User', active: true })
  dpsUserService.getRoles.mockResolvedValue({ dpsRoles: [{ code: 'HELD_ROLE', name: 'Held Role' }] })
  rolesService.getAssignableRoles.mockResolvedValue([
    { roleCode: 'HELD_ROLE', roleName: 'Held Role' },
    { roleCode: 'NEW_ROLE', roleName: 'New Role' },
  ])
  rolesService.getBannerMessage.mockResolvedValue('')
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET select DPS user roles', () => {
  it('renders the page with only the roles the user does not already have', async () => {
    const res = await request(app).get(selectUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Select roles')
    expect(res.text).toContain('New Role')
    expect(res.text).not.toContain('Held Role')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.VIEW_USER_ROLES,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })
  })

  it('redirects to the auth error page without a maintain access roles role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(selectUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST select DPS user roles', () => {
  it('converts a single selection to an array, audits and redirects to the user details', async () => {
    const res = await request(app).post(selectUrl).type('form').send({ roles: 'NEW_ROLE' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(dpsUserService.addRoles).toHaveBeenCalledWith(expect.any(String), userId, ['NEW_ROLE'])
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.ADD_USER_ROLES,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { roles: ['NEW_ROLE'] },
    })
  })

  it('passes multiple selections through as an array', async () => {
    await request(app)
      .post(selectUrl)
      .type('form')
      .send({ roles: ['A_ROLE', 'B_ROLE'] })

    expect(dpsUserService.addRoles).toHaveBeenCalledWith(expect.any(String), userId, ['A_ROLE', 'B_ROLE'])
  })

  it('flashes an error and redirects back when nothing is selected', async () => {
    const res = await request(app).post(selectUrl).type('form').send({})

    expect(res.headers.location).toBe(selectUrl)
    expect(flashStore.errors).toEqual([{ href: '#roles', text: 'Select at least one role' }])
    expect(dpsUserService.addRoles).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error when adding the roles fails', async () => {
    dpsUserService.addRoles.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(selectUrl).type('form').send({ roles: 'NEW_ROLE' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
