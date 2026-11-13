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
  changeGroupName: jest.fn(),
  changeChildGroupName: jest.fn(),
}
const auditService = createAuditServiceMock()

const parentCode = 'PARENT'
const childCode = 'CHILD'
const groupUrl = paths.groups.details({ group: parentCode })

// both routers are instances of the same template, so run the same suite against each
const variants = [
  {
    name: 'group',
    title: 'Change group name',
    currentName: 'Parent group',
    changeUrl: paths.groups.changeGroupName({ group: parentCode }),
    updater: groupsService.changeGroupName,
    updatedCode: parentCode,
    auditDetails: (groupName: string) => ({ groupName }),
  },
  {
    name: 'child group',
    title: 'Change child group name',
    currentName: 'Child group',
    changeUrl: paths.groups.changeChildGroupName({ group: parentCode, childGroup: childCode }),
    updater: groupsService.changeChildGroupName,
    updatedCode: childCode,
    auditDetails: (groupName: string) => ({ body: { groupName }, parentGroupCode: parentCode }),
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
  groupsService.groupDetails.mockResolvedValue({ groupCode: parentCode, groupName: 'Parent group' })
  groupsService.childGroupDetails.mockResolvedValue({ groupCode: childCode, groupName: 'Child group' })
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe.each(variants)(
  'change $name name',
  ({ title, currentName, changeUrl, updater, updatedCode, auditDetails }) => {
    describe('GET', () => {
      it('renders the page with the current name', async () => {
        const res = await request(app).get(changeUrl)

        expect(res.status).toBe(HttpStatusCode.OK)
        expect(res.text).toContain(title)
        expect(res.text).toContain(currentName)
      })

      it('redirects to the group list when the group cannot be found', async () => {
        groupsService.groupDetails.mockRejectedValue(new Error('not found'))

        const res = await request(app).get(changeUrl)

        expect(res.status).toBe(HttpStatusCode.FOUND)
        expect(res.headers.location).toBe(paths.groups.list.pattern)
      })

      it('redirects to the auth error page without the maintain oauth users role', async () => {
        app = buildApp([AuthRole.ROLES_ADMIN])

        const res = await request(app).get(changeUrl)

        expect(res.status).toBe(HttpStatusCode.FOUND)
        expect(res.headers.location).toBe('/authError')
      })
    })

    describe('POST', () => {
      it('changes the name, audits and redirects to the group details', async () => {
        const res = await request(app).post(changeUrl).type('form').send({ groupName: 'New name' })

        expect(res.status).toBe(HttpStatusCode.FOUND)
        expect(res.headers.location).toBe(groupUrl)
        expect(updater).toHaveBeenCalledWith(expect.any(String), updatedCode, { groupName: 'New name' })
        expect(auditService.logAuditEvent).toHaveBeenCalledWith({
          what: EventType.CHANGE_GROUP_NAME,
          who: user.username,
          subjectId: updatedCode,
          subjectType: 'GROUP_CODE',
          details: auditDetails('New name'),
        })
      })

      it('trims whitespace from the name before changing it', async () => {
        await request(app).post(changeUrl).type('form').send({ groupName: '  New name  ' })

        expect(updater).toHaveBeenCalledWith(expect.any(String), updatedCode, { groupName: 'New name' })
      })

      it('does not accept a name that is only whitespace', async () => {
        const res = await request(app).post(changeUrl).type('form').send({ groupName: '     ' })

        expect(res.headers.location).toBe(changeUrl)
        expect(flashStore.errors).toEqual([{ href: '#groupName', text: 'Enter a group name' }])
        expect(updater).not.toHaveBeenCalled()
      })

      it('flashes errors and redirects back when validation fails', async () => {
        const res = await request(app).post(changeUrl).type('form').send({ groupName: 'Bad <name>' })

        expect(res.headers.location).toBe(changeUrl)
        expect(flashStore.errors).toEqual([
          { href: '#groupName', text: "Group name can only contain 0-9, a-z and ( ) & , - . ' characters" },
        ])
        expect(flashStore.requestBody).toEqual([JSON.stringify({ groupName: 'Bad <name>' })])
        expect(updater).not.toHaveBeenCalled()
        expect(auditService.logAuditEvent).not.toHaveBeenCalled()
      })

      it('flashes the API message and redirects back on a bad request', async () => {
        updater.mockRejectedValue({
          responseStatus: HttpStatusCode.BAD_REQUEST,
          data: { userMessage: 'Name rejected' },
        })

        const res = await request(app).post(changeUrl).type('form').send({ groupName: 'New name' })

        expect(res.headers.location).toBe(changeUrl)
        expect(flashStore.errors).toEqual([{ text: 'Name rejected' }])
        expect(auditService.logAuditEvent).not.toHaveBeenCalled()
      })

      it('returns an error for other API failures', async () => {
        updater.mockRejectedValue(new Error('boom'))

        const res = await request(app).post(changeUrl).type('form').send({ groupName: 'New name' })

        expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
        expect(auditService.logAuditEvent).not.toHaveBeenCalled()
      })
    })
  },
)
