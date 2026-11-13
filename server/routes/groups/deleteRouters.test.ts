import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, tokenWithRoles, useInMemoryFlash } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const groupsService = {
  groupDetails: jest.fn(),
  childGroupDetails: jest.fn(),
  deleteGroup: jest.fn(),
  deleteChildGroup: jest.fn(),
}
const auditService = createAuditServiceMock()

const parentCode = 'PARENT'
const childCode = 'CHILD'
const parentUrl = paths.groups.details({ group: parentCode })

const variants = [
  {
    name: 'group',
    pageText: 'Parent group',
    deleteUrl: paths.groups.delete({ group: parentCode }),
    deleter: groupsService.deleteGroup,
    deletedCode: parentCode,
    successUrl: paths.groups.list.pattern,
    auditDetails: {},
  },
  {
    name: 'child group',
    pageText: 'Parent group',
    deleteUrl: paths.groups.deleteChildGroup({ group: parentCode, childGroup: childCode }),
    deleter: groupsService.deleteChildGroup,
    deletedCode: childCode,
    successUrl: parentUrl,
    auditDetails: { parentGroupCode: parentCode },
  },
]

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS]) =>
  appWithAllRoutes({
    services: { groupsService, auditService } as never,
    userSupplier: () => ({ ...user, token: tokenWithRoles(roles) }),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  groupsService.groupDetails.mockResolvedValue({ groupCode: parentCode, groupName: 'Parent group', children: [] })
  groupsService.childGroupDetails.mockResolvedValue({ groupCode: childCode, groupName: 'Child group' })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe.each(variants)('delete $name', ({ pageText, deleteUrl, deleter, deletedCode, successUrl, auditDetails }) => {
  describe('GET', () => {
    it('renders the confirmation page', async () => {
      const res = await request(app).get(deleteUrl)

      expect(res.status).toBe(HttpStatusCode.OK)
      expect(res.text).toContain(pageText)
    })

    it('redirects to the auth error page without the maintain oauth users role', async () => {
      app = buildApp([AuthRole.MAINTAIN_EMAIL_DOMAINS])

      const res = await request(app).get(deleteUrl)

      expect(res.status).toBe(HttpStatusCode.FOUND)
      expect(res.headers.location).toBe('/authError')
    })
  })

  describe('POST', () => {
    it('deletes the group, audits and redirects', async () => {
      const res = await request(app).post(deleteUrl).type('form').send({ confirmedGroup: deletedCode })

      expect(res.status).toBe(HttpStatusCode.FOUND)
      expect(res.headers.location).toBe(successUrl)
      expect(deleter).toHaveBeenCalledWith(expect.any(String), deletedCode)
      expect(auditService.logAuditEvent).toHaveBeenCalledWith({
        what: EventType.DELETE_GROUP,
        who: user.username,
        subjectId: deletedCode,
        subjectType: 'GROUP_CODE',
        details: auditDetails,
      })
    })

    it('trims whitespace from the confirmation before comparing', async () => {
      const res = await request(app)
        .post(deleteUrl)
        .type('form')
        .send({ confirmedGroup: `  ${deletedCode}  ` })

      expect(res.headers.location).toBe(successUrl)
      expect(deleter).toHaveBeenCalledWith(expect.any(String), deletedCode)
    })

    it('flashes an error and redirects back when the confirmation does not match', async () => {
      const res = await request(app).post(deleteUrl).type('form').send({ confirmedGroup: 'WRONG' })

      expect(res.headers.location).toBe(deleteUrl)
      expect(flashStore.errors).toEqual([
        { href: '#confirmedGroup', text: `Enter "${deletedCode}" to confirm deletion of group` },
      ])
      expect(deleter).not.toHaveBeenCalled()
      expect(auditService.logAuditEvent).not.toHaveBeenCalled()
    })

    it('returns an error when the delete fails', async () => {
      deleter.mockRejectedValue(new Error('boom'))

      const res = await request(app).post(deleteUrl).type('form').send({ confirmedGroup: deletedCode })

      expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
      expect(auditService.logAuditEvent).not.toHaveBeenCalled()
    })
  })
})

describe('GET delete group with child groups', () => {
  it('flashes an error and redirects to the group details', async () => {
    groupsService.groupDetails.mockResolvedValue({
      groupCode: parentCode,
      groupName: 'Parent group',
      children: [{ groupCode: childCode, groupName: 'Child group' }],
    })

    const res = await request(app).get(paths.groups.delete({ group: parentCode }))

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(parentUrl)
    expect(flashStore.errors).toEqual([
      {
        href: '#groupCode',
        text: 'Group has child groups please delete before trying to delete parent group',
      },
    ])
  })
})
