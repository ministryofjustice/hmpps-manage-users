import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from './testutils/appSetup'
import { userWithRoles } from './testutils/routerTestHelpers'
import AuthRole from '../interfaces/authRole'
import { HttpStatusCode } from '../utils/utils'

const menuService = { getBannerMessage: jest.fn(), getTiles: jest.fn() }

let app: Express

beforeEach(() => {
  menuService.getBannerMessage.mockResolvedValue('')
  menuService.getTiles.mockReturnValue([])
  app = appWithAllRoutes({
    services: { menuService } as never,
    userSupplier: () => userWithRoles([AuthRole.MAINTAIN_ACCESS_ROLES]),
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET menu', () => {
  it('renders the menu using the user roles', async () => {
    const res = await request(app).get('/')

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Manage user accounts')
    expect(menuService.getBannerMessage).toHaveBeenCalledWith(expect.any(String), ['MAINTAIN_ACCESS_ROLES'])
    expect(menuService.getTiles).toHaveBeenCalledWith(['MAINTAIN_ACCESS_ROLES'])
  })

  it('shows the banner message when there is one', async () => {
    menuService.getBannerMessage.mockResolvedValue('Planned maintenance tonight')

    const res = await request(app).get('/')

    expect(res.text).toContain('data-qa="banner-message"')
    expect(res.text).toContain('Planned maintenance tonight')
  })

  it('shows a message when the user has no admin functions', async () => {
    const res = await request(app).get('/')

    expect(res.text).toContain('data-qa="no-admin-functions-message"')
  })
})
