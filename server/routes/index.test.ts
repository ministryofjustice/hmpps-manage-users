import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes, user } from './testutils/appSetup'
import MenuService from '../services/menuService'
import { HttpStatusCode } from '../utils/utils'

jest.mock('../services/menuService')

const menuService = new MenuService({} as never) as jest.Mocked<MenuService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      menuService,
    },
    userSupplier: () => user,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /', () => {
  it('should render index page', () => {
    return request(app)
      .get('/')
      .expect('Content-Type', /html/)
      .expect(HttpStatusCode.OK)
      .expect(res => {
        expect(res.text).toContain('Manage user accounts')
      })
  })
})
