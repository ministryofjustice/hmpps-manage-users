import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { Page } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const externalUserService = { assignableGroups: jest.fn() }
const groupsService = { groupDetails: jest.fn() }
const auditService = createAuditServiceMock()

const listUrl = paths.groups.list.pattern
const group = {
  groupCode: 'GROUP_ONE',
  groupName: 'Group One',
  assignableRoles: [],
  children: [],
}
const detailsUrl = paths.groups.details({ group: group.groupCode })

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_OAUTH_USERS]) =>
  appWithAllRoutes({
    services: { externalUserService, groupsService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  externalUserService.assignableGroups.mockResolvedValue([group])
  groupsService.groupDetails.mockResolvedValue(group)
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET group list', () => {
  it('renders the page with the assignable groups and audits the page view', async () => {
    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Manage groups')
    expect(res.text).toContain('Group One')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_GROUP_LIST, { who: user.username })
  })

  it('accepts the auth group manager role', async () => {
    app = buildApp([AuthRole.AUTH_GROUP_MANAGER])

    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
  })

  it('redirects to the menu when the groups cannot be fetched', async () => {
    externalUserService.assignableGroups.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/')
  })

  it('redirects to the auth error page without a suitable role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).get(listUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST group list', () => {
  it('redirects to the details of the selected group', async () => {
    const res = await request(app).post(listUrl).type('form').send({ groupCode: group.groupCode })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
  })

  it.each(['', '   '])('flashes an error and redirects back for the group code %p', async groupCode => {
    const res = await request(app).post(listUrl).type('form').send({ groupCode })

    expect(res.headers.location).toBe(listUrl)
    expect(flashStore.errors).toEqual([{ href: '#groupCode', text: 'Enter a group code' }])
  })
})

describe('GET group details', () => {
  it('renders the page and audits the page view', async () => {
    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Group One')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_GROUP_DETAILS, {
      who: user.username,
      subjectId: group.groupCode,
      subjectType: 'GROUP_CODE',
    })
  })

  it('only shows the change and delete links to maintain oauth users', async () => {
    const maintainer = await request(app).get(detailsUrl)
    app = buildApp([AuthRole.AUTH_GROUP_MANAGER])
    const groupManager = await request(app).get(detailsUrl)

    expect(maintainer.text).toContain('data-qa="change-name-GROUP_ONE"')
    expect(groupManager.text).not.toContain('data-qa="change-name-GROUP_ONE"')
  })

  it('redirects to the group list when the group cannot be found', async () => {
    groupsService.groupDetails.mockRejectedValue(new Error('not found'))

    const res = await request(app).get(detailsUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(listUrl)
  })
})
