import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../testutils/appSetup'
import { createAuditServiceMock, FlashStore, tokenWithRoles, useInMemoryFlash } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const emailDomainsService = { createEmailDomain: jest.fn() }
const auditService = createAuditServiceMock()

const createUrl = paths.emailDomains.create.pattern
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
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /create-email-domain', () => {
  it('renders the create page', async () => {
    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Add Email Domain')
  })

  it('redirects to the auth error page without the maintain email domains role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(createUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST /create-email-domain', () => {
  it('creates the domain, audits and redirects to the list', async () => {
    emailDomainsService.createEmailDomain.mockResolvedValue({ id: 'domain-id' } as never)

    const res = await request(app).post(createUrl).type('form').send({ name: 'example.com', description: 'Example' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(listUrl)
    expect(emailDomainsService.createEmailDomain).toHaveBeenCalledWith(expect.any(String), {
      name: 'example.com',
      description: 'Example',
    })
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.CREATE_EMAIL_DOMAIN,
      who: user.username,
      subjectId: 'domain-id',
      subjectType: 'EMAIL_DOMAIN_ID',
      details: { name: 'example.com', description: 'Example' },
    })
  })

  it('trims whitespace from the form values before creating the domain', async () => {
    emailDomainsService.createEmailDomain.mockResolvedValue({ id: 'domain-id' } as never)

    await request(app).post(createUrl).type('form').send({ name: '  example.com  ', description: '  Example  ' })

    expect(emailDomainsService.createEmailDomain).toHaveBeenCalledWith(expect.any(String), {
      name: 'example.com',
      description: 'Example',
    })
  })

  it('does not accept values that are only whitespace', async () => {
    const res = await request(app).post(createUrl).type('form').send({ name: '      ', description: '   ' })

    expect(res.headers.location).toBe(createUrl)
    expect(emailDomainsService.createEmailDomain).not.toHaveBeenCalled()
    expect(flashStore.errors).toEqual([
      { href: '#name', text: 'Enter a domain name' },
      { href: '#description', text: 'Enter a domain description' },
    ])
  })

  it('flashes errors and redirects back when validation fails', async () => {
    const res = await request(app).post(createUrl).type('form').send({ name: 'a.b', description: '' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([
      { href: '#name', text: 'Domain name must be 6 characters or more' },
      { href: '#description', text: 'Enter a domain description' },
    ])
    expect(flashStore.requestBody).toEqual([JSON.stringify({ name: 'a.b', description: '' })])
    expect(emailDomainsService.createEmailDomain).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('flashes the API message and redirects back when the domain already exists', async () => {
    emailDomainsService.createEmailDomain.mockRejectedValue({
      responseStatus: HttpStatusCode.CONFLICT,
      data: { userMessage: 'Domain already exists' },
    })

    const res = await request(app).post(createUrl).type('form').send({ name: 'example.com', description: 'Example' })

    expect(res.headers.location).toBe(createUrl)
    expect(flashStore.errors).toEqual([{ href: '#name', text: 'Domain already exists' }])
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error for other API failures', async () => {
    emailDomainsService.createEmailDomain.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(createUrl).type('form').send({ name: 'example.com', description: 'Example' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
