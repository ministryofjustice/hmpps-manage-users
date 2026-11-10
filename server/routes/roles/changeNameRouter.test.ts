import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const rolesService = { getRoleDetails: jest.fn(), changeRoleName: jest.fn() }
const auditService = createAuditServiceMock()

const roleCode = 'TEST_ROLE'
const changeUrl = paths.roles.changeRoleName({ role: roleCode })
const detailsUrl = paths.roles.details({ role: roleCode })

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.ROLES_ADMIN]) =>
  appWithAllRoutes({
    services: { rolesService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  rolesService.getRoleDetails.mockResolvedValue({ roleCode, roleName: 'Test Role', roleDescription: 'Description' })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET change role name', () => {
  it('renders the page with the current name', async () => {
    const res = await request(app).get(changeUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Change role name for Test Role')
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

describe('POST change role name', () => {
  it('changes the name, audits and redirects to the role details', async () => {
    const res = await request(app).post(changeUrl).type('form').send({ roleName: 'New name' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(rolesService.changeRoleName).toHaveBeenCalledWith(expect.any(String), roleCode, { roleName: 'New name' })
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.UPDATE_ROLE,
      who: user.username,
      subjectId: roleCode,
      subjectType: 'ROLE_CODE',
      details: { newRoleName: 'New name' },
    })
  })

  it('trims whitespace from the name before changing it', async () => {
    await request(app).post(changeUrl).type('form').send({ roleName: '  New name  ' })

    expect(rolesService.changeRoleName).toHaveBeenCalledWith(expect.any(String), roleCode, { roleName: 'New name' })
  })

  it('does not accept a name that is only whitespace', async () => {
    const res = await request(app).post(changeUrl).type('form').send({ roleName: '     ' })

    expect(res.headers.location).toBe(changeUrl)
    expect(flashStore.errors).toEqual([{ href: '#roleName', text: 'Enter a role name' }])
    expect(rolesService.changeRoleName).not.toHaveBeenCalled()
  })

  it('flashes errors and redirects back when validation fails', async () => {
    const res = await request(app).post(changeUrl).type('form').send({ roleName: 'Bad <name>' })

    expect(res.headers.location).toBe(changeUrl)
    expect(flashStore.errors).toEqual([
      { href: '#roleName', text: "Role name can only contain 0-9, a-z and ( ) & , - . ' characters" },
    ])
    expect(flashStore.requestBody).toEqual([JSON.stringify({ roleName: 'Bad <name>' })])
    expect(rolesService.changeRoleName).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('flashes the API message and redirects back on a bad request', async () => {
    rolesService.changeRoleName.mockRejectedValue({
      responseStatus: HttpStatusCode.BAD_REQUEST,
      data: { userMessage: 'Name rejected' },
    })

    const res = await request(app).post(changeUrl).type('form').send({ roleName: 'New name' })

    expect(res.headers.location).toBe(changeUrl)
    expect(flashStore.errors).toEqual([{ text: 'Name rejected' }])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    rolesService.changeRoleName.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(changeUrl).type('form').send({ roleName: 'New name' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
