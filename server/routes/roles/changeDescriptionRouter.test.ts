import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, tokenWithRoles, useInMemoryFlash } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const rolesService = { getRoleDetails: jest.fn(), changeRoleDescription: jest.fn() }
const auditService = createAuditServiceMock()

const roleCode = 'TEST_ROLE'
const changeUrl = paths.roles.changeRoleDescription({ role: roleCode })
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
    roleDescription: 'Existing description',
  })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET change role description', () => {
  it('renders the page with the current description', async () => {
    const res = await request(app).get(changeUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Change role description for Test Role')
    expect(res.text).toContain('Existing description')
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

describe('POST change role description', () => {
  it('changes the description, audits and redirects to the role details', async () => {
    const res = await request(app).post(changeUrl).type('form').send({ roleDescription: 'New description' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(rolesService.changeRoleDescription).toHaveBeenCalledWith(expect.any(String), roleCode, {
      roleDescription: 'New description',
    })
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.UPDATE_ROLE,
      who: user.username,
      subjectId: roleCode,
      subjectType: 'ROLE_CODE',
      details: { newRoleDescription: 'New description' },
    })
  })

  it('trims whitespace from the description before changing it', async () => {
    await request(app).post(changeUrl).type('form').send({ roleDescription: '  New description  ' })

    expect(rolesService.changeRoleDescription).toHaveBeenCalledWith(expect.any(String), roleCode, {
      roleDescription: 'New description',
    })
  })

  it('allows an empty description', async () => {
    const res = await request(app).post(changeUrl).type('form').send({ roleDescription: '   ' })

    expect(res.headers.location).toBe(detailsUrl)
    expect(rolesService.changeRoleDescription).toHaveBeenCalledWith(expect.any(String), roleCode, {
      roleDescription: '',
    })
  })

  it('flashes errors and redirects back when validation fails', async () => {
    const res = await request(app).post(changeUrl).type('form').send({ roleDescription: 'Bad <description>' })

    expect(res.headers.location).toBe(changeUrl)
    expect(flashStore.errors).toEqual([
      {
        href: '#roleDescription',
        text: "Role description can only contain 0-9, a-z, newline and ( ) & , - . ' characters",
      },
    ])
    expect(flashStore.requestBody).toEqual([JSON.stringify({ roleDescription: 'Bad <description>' })])
    expect(rolesService.changeRoleDescription).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('flashes the API message and redirects back on a bad request', async () => {
    rolesService.changeRoleDescription.mockRejectedValue({
      responseStatus: HttpStatusCode.BAD_REQUEST,
      data: { userMessage: 'Description rejected' },
    })

    const res = await request(app).post(changeUrl).type('form').send({ roleDescription: 'New description' })

    expect(res.headers.location).toBe(changeUrl)
    expect(flashStore.errors).toEqual([{ text: 'Description rejected' }])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    rolesService.changeRoleDescription.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(changeUrl).type('form').send({ roleDescription: 'New description' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
