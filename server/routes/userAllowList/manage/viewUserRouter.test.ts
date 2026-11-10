import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { Page } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const userAllowListService = { getAllowListUser: jest.fn() }
const auditService = createAuditServiceMock()

const username = 'ALLOWED1'
const viewUrl = paths.userAllowList.manage.view({ username })

const allowListUser = {
  id: 'allow-id',
  username,
  firstName: 'Alan',
  lastName: 'Lowe',
  email: 'alan.lowe@justice.gov.uk',
  allowlistEndDate: '2999-01-01',
}

let app: Express

const buildApp = (roles: string[] = [AuthRole.MANAGE_USER_ALLOW_LIST]) =>
  appWithAllRoutes({
    services: { userAllowListService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  userAllowListService.getAllowListUser.mockResolvedValue(allowListUser)
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET view allow list user', () => {
  it('renders the user as active and audits the page view', async () => {
    const res = await request(app).get(viewUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Alan Lowe')
    expect(res.text).toContain('data-qa="status-tag"')
    expect(userAllowListService.getAllowListUser).toHaveBeenCalledWith(expect.any(String), username)
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_ALLOW_LIST_USER, {
      who: user.username,
      subjectId: allowListUser.id,
      subjectType: 'USER_ID',
    })
  })

  it('renders the user as expired once the end date has passed', async () => {
    userAllowListService.getAllowListUser.mockResolvedValue({ ...allowListUser, allowlistEndDate: '2000-01-01' })

    const res = await request(app).get(viewUrl)

    expect(res.text).toContain('govuk-tag--pink')
  })

  it('redirects to the auth error page without the manage user allow list role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(viewUrl)

    expect(res.headers.location).toBe('/authError')
  })

  it('returns an error when the user cannot be fetched', async () => {
    userAllowListService.getAllowListUser.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(viewUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })
})
