import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { Page } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const emailDomainsService = { getAllEmailDomains: jest.fn() }
const auditService = createAuditServiceMock()

const listUrl = paths.emailDomains.list.pattern

let app: Express

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_EMAIL_DOMAINS]) =>
  appWithAllRoutes({
    services: { emailDomainsService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  emailDomainsService.getAllEmailDomains.mockResolvedValue([
    { id: 'id-1', domain: 'example.com', description: 'Example' },
  ])
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET email domain list', () => {
  it('renders the domains and audits the page view', async () => {
    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Manage Email Domains')
    expect(res.text).toContain('example.com')
    expect(auditService.logPageView).toHaveBeenCalledWith(Page.VIEW_EMAIL_DOMAINS, { who: user.username })
  })

  it('shows a message when there are no domains', async () => {
    emailDomainsService.getAllEmailDomains.mockResolvedValue([])

    const res = await request(app).get(listUrl)

    expect(res.text).toContain('There are no registered email domains')
  })

  it('redirects to the auth error page without the maintain email domains role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(listUrl)

    expect(res.headers.location).toBe('/authError')
  })

  it('returns an error when the domains cannot be fetched', async () => {
    emailDomainsService.getAllEmailDomains.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(listUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })
})
