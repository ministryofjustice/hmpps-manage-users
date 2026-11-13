import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, tokenWithRoles, useInMemoryFlash } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const emailDomainsService = { getEmailDomain: jest.fn(), deleteEmailDomain: jest.fn() }
const auditService = createAuditServiceMock()

const emailDomain = { id: 'domain-id', domain: 'example.com', description: 'Example' }
const deleteUrl = paths.emailDomains.deleteWithId({ id: emailDomain.id })
const listUrl = paths.emailDomains.list.pattern

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_EMAIL_DOMAINS]) =>
  appWithAllRoutes({
    services: { emailDomainsService, auditService } as never,
    userSupplier: () => ({ ...user, token: tokenWithRoles(roles) }),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  emailDomainsService.getEmailDomain.mockResolvedValue(emailDomain)
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET delete email domain', () => {
  it('renders the confirmation page', async () => {
    const res = await request(app).get(deleteUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('example.com')
  })

  it('redirects to the list when the domain cannot be found', async () => {
    emailDomainsService.getEmailDomain.mockRejectedValue(new Error('not found'))

    const res = await request(app).get(deleteUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(listUrl)
  })

  it('redirects to the auth error page without the maintain email domains role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(deleteUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST delete email domain', () => {
  it('deletes the domain, audits and redirects to the list', async () => {
    const res = await request(app).post(deleteUrl).type('form').send({ confirmedDomain: 'example.com' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(listUrl)
    expect(emailDomainsService.deleteEmailDomain).toHaveBeenCalledWith(expect.any(String), emailDomain.id)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.DELETE_EMAIL_DOMAIN,
      who: user.username,
      subjectId: emailDomain.id,
      subjectType: 'EMAIL_DOMAIN_ID',
      details: emailDomain,
    })
  })

  it('trims whitespace from the confirmation before comparing', async () => {
    const res = await request(app).post(deleteUrl).type('form').send({ confirmedDomain: '  example.com  ' })

    expect(res.headers.location).toBe(listUrl)
    expect(emailDomainsService.deleteEmailDomain).toHaveBeenCalled()
  })

  it('flashes an error and redirects back when the confirmation does not match', async () => {
    const res = await request(app).post(deleteUrl).type('form').send({ confirmedDomain: 'other.com' })

    expect(res.headers.location).toBe(deleteUrl)
    expect(flashStore.errors).toEqual([
      { href: '#confirmedDomain', text: 'Enter "example.com" to confirm deletion of domain' },
    ])
    expect(emailDomainsService.deleteEmailDomain).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error when the delete fails', async () => {
    emailDomainsService.deleteEmailDomain.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(deleteUrl).type('form').send({ confirmedDomain: 'example.com' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
