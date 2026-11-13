import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const externalUserService = {
  getUser: jest.fn(),
  assignableGroups: jest.fn(),
  getUserGroups: jest.fn(),
  addGroup: jest.fn(),
}
const auditService = createAuditServiceMock()

const userId = 'USER-ID'
const selectUrl = paths.externalUser.manage.selectGroup({ userId })
const detailsUrl = paths.externalUser.manage.details({ userId })

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS]) =>
  appWithAllRoutes({
    services: { externalUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  externalUserService.getUser.mockResolvedValue({ userId, firstName: 'Test', lastName: 'User' })
  externalUserService.assignableGroups.mockResolvedValue([
    { groupCode: 'HELD', groupName: 'Held Group' },
    { groupCode: 'NEW', groupName: 'New Group' },
  ])
  externalUserService.getUserGroups.mockResolvedValue([{ groupCode: 'HELD', groupName: 'Held Group' }])
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET select external user group', () => {
  it('renders the page with only the groups the user does not already belong to', async () => {
    const res = await request(app).get(selectUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Select group')
    expect(res.text).toContain('New Group')
    expect(res.text).not.toContain('Held Group')
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).get(selectUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST select external user group', () => {
  it('adds the group, audits and redirects to the user details', async () => {
    const res = await request(app).post(selectUrl).type('form').send({ group: 'NEW' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(externalUserService.addGroup).toHaveBeenCalledWith(expect.any(String), userId, 'NEW')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.ADD_USER_GROUP,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { group: 'NEW' },
    })
  })

  it('flashes an error and redirects back when no group is selected', async () => {
    const res = await request(app).post(selectUrl).type('form').send({})

    expect(res.headers.location).toBe(selectUrl)
    expect(flashStore.errors).toEqual([{ href: '#group', text: 'Select a group' }])
    expect(externalUserService.addGroup).not.toHaveBeenCalled()
  })

  it.each([
    {
      name: 'forbidden',
      responseStatus: HttpStatusCode.FORBIDDEN,
      text: 'You are not able to maintain this user anymore, user does not belong to any groups you manage',
    },
    { name: 'a conflict', responseStatus: HttpStatusCode.CONFLICT, text: 'User already belongs to that group' },
  ])('flashes an error and redirects back when the API returns $name', async ({ responseStatus, text }) => {
    externalUserService.addGroup.mockRejectedValue({ responseStatus })

    const res = await request(app).post(selectUrl).type('form').send({ group: 'NEW' })

    expect(res.headers.location).toBe(selectUrl)
    expect(flashStore.errors).toEqual([{ href: '#group', text }])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it.each([
    ['an API error', { responseStatus: HttpStatusCode.INTERNAL_SERVER_ERROR }],
    ['a non API error', new Error('boom')],
  ])('returns an error for %s', async (_name, error) => {
    externalUserService.addGroup.mockRejectedValue(error)

    const res = await request(app).post(selectUrl).type('form').send({ group: 'NEW' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
