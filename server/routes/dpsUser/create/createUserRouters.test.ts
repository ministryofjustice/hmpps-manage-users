import type { Express } from 'express'
import request from 'supertest'
import { appWithAllRoutes } from '../../testutils/appSetup'
import { FlashStore, useInMemoryFlash, userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import paths from '../../paths'
import { HttpStatusCode } from '../../../utils/utils'

const selectUrl = paths.dpsUser.createUser.pattern
const optionsUrl = paths.dpsUser.createUserOptions.pattern

let app: Express
let flashStore: FlashStore

const buildApp = (roles: string[] = [AuthRole.CREATE_USER]) =>
  appWithAllRoutes({
    services: {} as never,
    userSupplier: () => userWithRoles(roles),
  })

beforeEach(() => {
  flashStore = useInMemoryFlash()
  app = buildApp()
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('create DPS user - select user type', () => {
  it('renders the page', async () => {
    const res = await request(app).get(selectUrl)

    expect(res.status).toBe(HttpStatusCode.OK)
    expect(res.text).toContain('Create a DPS user')
  })

  it('redirects to the auth error page without the create user role', async () => {
    app = buildApp(['ROLE_OTHER'])

    const res = await request(app).get(selectUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe('/authError')
  })

  it('redirects to the options page when a user type is selected', async () => {
    const res = await request(app).post(selectUrl).type('form').send({ userType: 'DPS_GEN' })

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(optionsUrl)
    expect(flashStore.requestBody).toEqual([JSON.stringify({ userType: 'DPS_GEN' })])
  })

  it('flashes an error and redirects back when no user type is selected', async () => {
    const res = await request(app).post(selectUrl).type('form').send({})

    expect(res.headers.location).toBe(selectUrl)
    expect(flashStore.errors).toEqual([{ href: '#userType', text: 'Select a user type' }])
  })
})

describe('create DPS user - existing account option', () => {
  it('redirects to the select user type page when no user type has been chosen', async () => {
    const res = await request(app).get(optionsUrl)

    expect(res.status).toBe(HttpStatusCode.FOUND)
    expect(res.headers.location).toBe(selectUrl)
  })

  it('redirects to the create linked user page when the user has an existing account', async () => {
    const res = await request(app).post(optionsUrl).type('form').send({ userType: 'DPS_GEN', userExists: 'true' })

    expect(res.headers.location).toBe(paths.dpsUser.createLinkedDpsUser.pattern)
  })

  it('redirects to the create user page when the user has no existing account', async () => {
    const res = await request(app).post(optionsUrl).type('form').send({ userType: 'DPS_GEN', userExists: 'false' })

    expect(res.headers.location).toBe(paths.dpsUser.createDpsUser.pattern)
  })

  it('flashes an error and redirects back when no option is selected', async () => {
    const res = await request(app).post(optionsUrl).type('form').send({ userType: 'DPS_GEN' })

    expect(res.headers.location).toBe(optionsUrl)
    expect(flashStore.errors).toEqual([{ href: '#userExists', text: 'Select if user has an existing account' }])
  })
})
