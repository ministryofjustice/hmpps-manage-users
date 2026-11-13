import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const groupsService = {
  groupDetails: jest.fn(),
  createGroup: jest.fn(),
  createChildGroup: jest.fn(),
}
const auditService = createAuditServiceMock()

const parentCode = 'PARENT'
const newCode = 'NEW_GROUP'

// both routers are instances of the same template, so run the same suite against each
const variants = [
  {
    name: 'group',
    title: 'Create Group',
    createUrl: paths.groups.create.pattern,
    successUrl: paths.groups.details({ group: newCode }),
    expectCreated: (body: object) => expect(groupsService.createGroup).toHaveBeenCalledWith(expect.any(String), body),
    createMock: groupsService.createGroup,
    auditDetails: (body: object) => body,
  },
  {
    name: 'child group',
    title: 'Create child group',
    createUrl: paths.groups.createChildGroup({ group: parentCode }),
    successUrl: paths.groups.details({ group: parentCode }),
    expectCreated: (body: object) =>
      expect(groupsService.createChildGroup).toHaveBeenCalledWith(expect.any(String), parentCode, body),
    createMock: groupsService.createChildGroup,
    auditDetails: (body: object) => ({ body, parentGroupCode: parentCode }),
  },
]

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS]) =>
  appWithAllRoutes({
    services: { groupsService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  groupsService.groupDetails.mockResolvedValue({ groupCode: parentCode, groupName: 'Parent group' })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe.each(variants)('create $name', ({ title, createUrl, successUrl, expectCreated, createMock, auditDetails }) => {
  const newGroup = { groupCode: newCode, groupName: 'New group' }

  describe('GET', () => {
    it('renders the page', async () => {
      const res = await request(app).get(createUrl)

      expect(res.status).toBe(HttpStatusCode.OK)
      expect(res.text).toContain(title)
    })

    it('redirects to the auth error page without the maintain oauth users role', async () => {
      app = buildApp([AuthRole.ROLES_ADMIN])

      const res = await request(app).get(createUrl)

      expect(res.status).toBe(HttpStatusCode.FOUND)
      expect(res.headers.location).toBe('/authError')
    })
  })

  describe('POST', () => {
    it('creates the group, audits and redirects', async () => {
      const res = await request(app).post(createUrl).type('form').send(newGroup)

      expect(res.status).toBe(HttpStatusCode.FOUND)
      expect(res.headers.location).toBe(successUrl)
      expectCreated(newGroup)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: EventType.CREATE_GROUP,
        who: user.username,
        subjectId: newCode,
        subjectType: 'GROUP_CODE',
        details: auditDetails(newGroup),
      })
    })

    it('trims whitespace from the code and name before creating the group', async () => {
      await request(app).post(createUrl).type('form').send({ groupCode: '  NEW_GROUP  ', groupName: '  New group  ' })

      expectCreated(newGroup)
    })

    it('does not accept values that are only whitespace', async () => {
      const res = await request(app).post(createUrl).type('form').send({ groupCode: '   ', groupName: '   ' })

      expect(res.headers.location).toBe(createUrl)
      expect(flashStore.errors).toEqual([
        { href: '#groupName', text: 'Enter a group name' },
        { href: '#groupCode', text: 'Enter a group code' },
      ])
      expect(createMock).not.toHaveBeenCalled()
    })

    it('flashes errors and redirects back when validation fails', async () => {
      const res = await request(app)
        .post(createUrl)
        .type('form')
        .send({ groupCode: 'bad code', groupName: 'New group' })

      expect(res.headers.location).toBe(createUrl)
      expect(flashStore.errors).toEqual([
        { href: '#groupCode', text: 'Group code can only contain 0-9, A-Z and _ characters' },
      ])
      expect(flashStore.requestBody).toEqual([JSON.stringify({ groupCode: 'bad code', groupName: 'New group' })])
      expect(createMock).not.toHaveBeenCalled()
      expect(auditService.logAuditEvent).not.toHaveBeenCalled()
    })

    it('flashes an error and redirects back when the group code already exists', async () => {
      createMock.mockRejectedValue({ responseStatus: HttpStatusCode.CONFLICT, data: { userMessage: 'Conflict' } })

      const res = await request(app).post(createUrl).type('form').send(newGroup)

      expect(res.headers.location).toBe(createUrl)
      expect(flashStore.errors).toEqual([{ href: '#groupCode', text: 'Group code already exists' }])
      expect(auditService.logAuditEvent).not.toHaveBeenCalled()
    })

    it('returns an error for other API failures', async () => {
      createMock.mockRejectedValue(new Error('boom'))

      const res = await request(app).post(createUrl).type('form').send(newGroup)

      expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      expect(auditService.logAuditEvent).not.toHaveBeenCalled()
    })
  })
})
