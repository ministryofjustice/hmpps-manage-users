import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, tokenWithRoles, useInMemoryFlash } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const rolesService = { getRoleDetails: jest.fn(), changeRoleAdminType: jest.fn() }
const auditService = createAuditServiceMock()

const roleCode = 'TEST_ROLE'
const changeUrl = paths.roles.changeRoleAdminType({ role: roleCode })
const detailsUrl = paths.roles.details({ role: roleCode })

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.ROLES_ADMIN]) =>
  appWithAllRoutes({
    services: { rolesService, auditService } as never,
    userSupplier: () => ({ ...user, token: tokenWithRoles(roles) }),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  rolesService.getRoleDetails.mockResolvedValue({
    roleCode,
    roleName: 'Test Role',
    roleDescription: 'Description',
    adminType: [{ adminTypeCode: 'EXT_ADM' }],
  })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET change role admin type', () => {
  it('renders the page', async () => {
    const res = await request(app).get(changeUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Change role admin type for Test Role')
  })

  it('redirects to the role list when the role cannot be found', async () => {
    rolesService.getRoleDetails.mockRejectedValue(new Error('not found'))

    const res = await request(app).get(changeUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(paths.roles.list.pattern)
  })

  it('redirects to the auth error page without the roles admin role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(changeUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST change role admin type', () => {
  it('converts a single selection to an array, audits and redirects to the role details', async () => {
    const res = await request(app).post(changeUrl).type('form').send({ adminType: 'DPS_ADM' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(rolesService.changeRoleAdminType).toHaveBeenCalledWith(expect.any(String), roleCode, {
      adminType: ['DPS_ADM'],
    })
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.UPDATE_ROLE,
      who: user.username,
      subjectId: roleCode,
      subjectType: 'ROLE_CODE',
      details: { newAdminType: ['DPS_ADM'] },
    })
  })

  it('passes multiple selections through as an array', async () => {
    await request(app)
      .post(changeUrl)
      .type('form')
      .send({ adminType: ['EXT_ADM', 'DPS_ADM'] })

    expect(rolesService.changeRoleAdminType).toHaveBeenCalledWith(expect.any(String), roleCode, {
      adminType: ['EXT_ADM', 'DPS_ADM'],
    })
  })

  it('flashes an error and redirects back when nothing is selected', async () => {
    const res = await request(app).post(changeUrl).type('form').send({})

    expect(res.headers.location).toBe(changeUrl)
    expect(flashStore.errors).toEqual([{ href: '#adminType', text: 'Select an admin type' }])
    expect(rolesService.changeRoleAdminType).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('flashes the API message and redirects back on a bad request', async () => {
    rolesService.changeRoleAdminType.mockRejectedValue({
      responseStatus: HttpStatusCode.BAD_REQUEST,
      data: { userMessage: 'Admin type rejected' },
    })

    const res = await request(app).post(changeUrl).type('form').send({ adminType: 'DPS_ADM' })

    expect(res.headers.location).toBe(changeUrl)
    expect(flashStore.errors).toEqual([{ text: 'Admin type rejected' }])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    rolesService.changeRoleAdminType.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(changeUrl).type('form').send({ adminType: 'DPS_ADM' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
