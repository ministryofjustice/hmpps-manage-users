import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const rolesService = { createRole: jest.fn(), getRoleDetails: jest.fn() }
const auditService = createAuditServiceMock()

const createUrl = paths.roles.create.pattern
const newRole = {
  roleName: 'New Role',
  roleCode: 'NEW_ROLE',
  roleDescription: 'A description',
  adminType: 'EXT_ADM', // a single checked box is posted as a string; the service converts it to an array
}

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.ROLES_ADMIN]) =>
  appWithAllRoutes({
    services: { rolesService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  // the roles router's 'role' param handler also matches create-role, so it must not fail when an error is passed on
  rolesService.getRoleDetails.mockResolvedValue({ roleCode: 'create-role' })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET create role', () => {
  it('renders the page', async () => {
    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
  })

  it('redirects to the auth error page without the roles admin role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST create role', () => {
  it('creates the role, audits and redirects to the role details', async () => {
    const res = await request(app).post(createUrl).type('form').send(newRole)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(paths.roles.details({ role: 'NEW_ROLE' }))
    expect(rolesService.createRole).toHaveBeenCalledWith(expect.any(String), newRole)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.CREATE_ROLE,
      who: user.username,
      subjectId: 'NEW_ROLE',
      subjectType: 'ROLE_CODE',
      details: newRole,
    })
  })

  it('trims whitespace from the values before creating the role', async () => {
    await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...newRole, roleName: '  New Role  ', roleCode: '  NEW_ROLE  ', roleDescription: '  A description  ' })

    expect(rolesService.createRole).toHaveBeenCalledWith(expect.any(String), newRole)
  })

  it('does not accept values that are only whitespace', async () => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ roleName: '   ', roleCode: '   ', roleDescription: '   ' })

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([
      { href: '#roleName', text: 'Enter a role name' },
      { href: '#roleCode', text: 'Enter a role code' },
      { href: '#adminType', text: 'Select an admin type' },
    ])
    expect(rolesService.createRole).not.toHaveBeenCalled()
  })

  it('flashes errors and redirects back when validation fails', async () => {
    const res = await request(app)
      .post(createUrl)
      .type('form')
      .send({ ...newRole, roleCode: 'bad code' })

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([
      { href: '#roleCode', text: 'Role code can only contain 0-9, A-Z and _ characters' },
    ])
    expect(rolesService.createRole).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('renders the validation errors after following the redirect', async () => {
    const postRes = await request(app).post(createUrl).type('form').send({ roleName: '   ' })
    const res = await request(app).get(postRes.headers.location)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Enter a role name')
    expect(res.text).toContain('Enter a role code')
    expect(res.text).toContain('Select an admin type')
  })

  it('flashes an error and redirects back when the role code already exists', async () => {
    rolesService.createRole.mockRejectedValue({ responseStatus: HttpStatusCode.CONFLICT, data: { userMessage: 'x' } })

    const res = await request(app).post(createUrl).type('form').send(newRole)

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([{ href: '#roleCode', text: 'Role code already exists' }])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    rolesService.createRole.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(createUrl).type('form').send(newRole)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
