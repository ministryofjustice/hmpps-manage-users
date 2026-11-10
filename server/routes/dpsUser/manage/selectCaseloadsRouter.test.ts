import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from '../../testutils/appSetup'
import { createAuditServiceMock, FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { EventType } from '../../audit'
import { HttpStatusCode } from '../../../utils/utils'

const dpsUserService = {
  getDpsUser: jest.fn(),
  getUserCaseloads: jest.fn(),
  getCaseloads: jest.fn(),
  addCaseloads: jest.fn(),
}
const auditService = createAuditServiceMock()

const userId = 'TESTUSER'
const selectUrl = paths.dpsUser.manage.selectCaseloads({ userId })
const detailsUrl = paths.dpsUser.manage.details({ userId })

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]) =>
  appWithAllRoutes({
    services: { dpsUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  dpsUserService.getDpsUser.mockResolvedValue({ username: userId, firstName: 'Test', lastName: 'User' })
  dpsUserService.getUserCaseloads.mockResolvedValue({ caseloads: [{ id: 'MDI', name: 'Moorland' }] })
  dpsUserService.getCaseloads.mockResolvedValue([
    { id: 'MDI', name: 'Moorland' },
    { id: 'LEI', name: 'Leeds' },
  ])
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET select DPS user caseloads', () => {
  it('renders the page with only the caseloads the user does not already have', async () => {
    const res = await request(app).get(selectUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Select caseloads')
    expect(res.text).toContain('Leeds')
    expect(res.text).not.toContain('Moorland')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.VIEW_USER_CASELOADS,
      who: userId,
      subjectId: userId,
      subjectType: 'USER_ID',
    })
  })

  it('redirects to the auth error page without the maintain access roles admin role', async () => {
    app = buildApp([AuthRole.MAINTAIN_ACCESS_ROLES])

    const res = await request(app).get(selectUrl)

    expect(res.headers.location).toBe('/authError')
  })
})

describe('POST select DPS user caseloads', () => {
  it('converts a single selection to an array, audits and redirects to the user details', async () => {
    const res = await request(app).post(selectUrl).type('form').send({ caseloads: 'LEI' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(detailsUrl)
    expect(dpsUserService.addCaseloads).toHaveBeenCalledWith(expect.any(String), userId, ['LEI'])
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: EventType.ADD_USER_CASELOADS,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { caseloads: ['LEI'] },
    })
  })

  it('passes multiple selections through as an array', async () => {
    await request(app)
      .post(selectUrl)
      .type('form')
      .send({ caseloads: ['LEI', 'BXI'] })

    expect(dpsUserService.addCaseloads).toHaveBeenCalledWith(expect.any(String), userId, ['LEI', 'BXI'])
  })

  it('flashes an error and redirects back when nothing is selected', async () => {
    const res = await request(app).post(selectUrl).type('form').send({})

    expect(res.headers.location).toBe(selectUrl)
    expect(flashStore.errors).toEqual([{ href: '#caseloads', text: 'Select at least one caseload' }])
    expect(dpsUserService.addCaseloads).not.toHaveBeenCalled()
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })

  it('returns an error when adding the caseloads fails', async () => {
    dpsUserService.addCaseloads.mockRejectedValue(new Error('boom'))

    const res = await request(app).post(selectUrl).type('form').send({ caseloads: 'LEI' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).not.toHaveBeenCalled()
  })
})
