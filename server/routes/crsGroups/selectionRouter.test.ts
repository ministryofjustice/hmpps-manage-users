import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from '../testutils/appSetup'
import { createAuditServiceMock, useInMemoryFlash, userWithRoles } from '../testutils/routerTestHelpers'
import AuthRole from '../../interfaces/authRole'
import paths from '../paths'
import { EventType } from '../audit'
import { HttpStatusCode } from '../../utils/utils'

const groupsService = { getAllCRSGroups: jest.fn() }
const externalUserService = { getUsersInCRSGroup: jest.fn() }
const auditService = createAuditServiceMock()

const selectUrl = paths.crsGroups.select.pattern
const downloadUrl = paths.crsGroups.download.pattern

const members = [
  {
    email: 'member@example.com',
    enabled: true,
    firstName: 'Mem',
    lastName: 'Ber',
    lastLoggedIn: '2026-01-01T10:00:00',
    inactiveReason: undefined as string | undefined,
  },
]

let app: Express

const buildApp = (roles: string[] = [AuthRole.CONTRACT_MANAGER_VIEW_GROUP]) =>
  appWithAllRoutes({
    services: { groupsService, externalUserService, auditService } as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  useInMemoryFlash()
  groupsService.getAllCRSGroups.mockResolvedValue([
    { groupCode: 'CRS_A', groupName: 'CRS Group A' },
    { groupCode: 'CRS_B', groupName: 'CRS Group B' },
  ])
  externalUserService.getUsersInCRSGroup.mockResolvedValue(members)
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET CRS group selection', () => {
  it('renders the group dropdown when no group is selected', async () => {
    const res = await request(app).get(selectUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('CRS Group Selection')
    expect(res.text).toContain('CRS Group B')
    expect(res.text).not.toContain('data-qa="selected-group-header"')
    expect(externalUserService.getUsersInCRSGroup).not.toHaveBeenCalled()
  })

  it('shows the selected group and the download button when it has members', async () => {
    const res = await request(app).get(selectUrl).query({ group: 'CRS_A' })

    expect(res.text).toContain('data-qa="selected-group-value"')
    expect(res.text).toContain('data-qa="download-button"')
    expect(res.text).toContain(`${downloadUrl}?group=CRS_A`)
    expect(externalUserService.getUsersInCRSGroup).toHaveBeenCalledWith(expect.any(String), 'CRS_A')
  })

  it('says the group is empty and hides the download when it has no members', async () => {
    externalUserService.getUsersInCRSGroup.mockResolvedValue([])

    const res = await request(app).get(selectUrl).query({ group: 'CRS_A' })

    expect(res.text).toContain('data-qa="empty-group-selected-message"')
    expect(res.text).not.toContain('data-qa="download-button"')
  })

  it('shows an error when the group does not exist or is not visible', async () => {
    const res = await request(app).get(selectUrl).query({ group: 'OTHER' })

    expect(res.text).toContain('data-qa="error-summary"')
    expect(res.text).toContain('doesn&#39;t exist or you don&#39;t have permission')
    expect(res.text).not.toContain('data-qa="download-button"')
    expect(externalUserService.getUsersInCRSGroup).not.toHaveBeenCalled()
  })

  it('redirects to the auth error page without the contract manager role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(selectUrl)

    expect(res.headers.location).toBe('/authError')
  })

  it('returns an error when the groups cannot be fetched', async () => {
    groupsService.getAllCRSGroups.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(selectUrl)

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
  })
})

describe('GET CRS group download', () => {
  it('returns the group members as a csv attachment and audits the attempt', async () => {
    const res = await request(app).get(downloadUrl).query({ group: 'CRS_A' })

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.headers['content-type']).toContain('text/csv')
    expect(res.headers['content-disposition']).toContain('crs-group-members.csv')
    expect(res.text).toContain('"email","enabled","firstName","lastName","lastLoggedIn","inactiveReason"')
    expect(res.text).toContain('"member@example.com"')
    expect(externalUserService.getUsersInCRSGroup).toHaveBeenCalledWith(expect.any(String), 'CRS_A')
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.DOWNLOAD_REPORT_ATTEMPT }),
    )
  })

  it('returns a plain text error and audits a failure when the download fails', async () => {
    externalUserService.getUsersInCRSGroup.mockRejectedValue(new Error('boom'))

    const res = await request(app).get(downloadUrl).query({ group: 'CRS_A' })

    expect(res.status).toBe(HttpStatusCode.INTERNAL_SERVER_ERROR)
    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ what: EventType.DOWNLOAD_REPORT_FAILURE }),
    )
  })

  it('redirects to the auth error page without the contract manager role', async () => {
    app = buildApp([AuthRole.MAINTAIN_OAUTH_USERS])

    const res = await request(app).get(downloadUrl).query({ group: 'CRS_A' })

    expect(res.headers.location).toBe('/authError')
    expect(externalUserService.getUsersInCRSGroup).not.toHaveBeenCalled()
  })
})
