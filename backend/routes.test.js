const request = require('supertest')
const express = require('express')
const bodyParser = require('body-parser')
const routes = require('./routes')

const { prisonApiFactory } = require('./api/prisonApi')
const { oauthApiFactory } = require('./api/oauthApi')

const errorResponse = {
  response: {
    body: {
      status: 500,
      userMessage: 'Test error',
    },
  },
}

describe('Routes', () => {
  let client
  let oauthApi
  let prisonApi
  let app

  beforeEach(() => {
    client = {
      get: () => Promise.reject(errorResponse),
      post: () => Promise.reject(errorResponse),
      put: () => Promise.reject(errorResponse),
      del: () => Promise.reject(errorResponse),
    }

    oauthApi = oauthApiFactory(client, {})
    prisonApi = prisonApiFactory(client, {})

    app = express()
    app.use(bodyParser.json())
    app.use(routes({ oauthApi, prisonApi }))
  })

  const getRoutes = [
    'me',
    'userSearch',
    'auth-user-get',
    'auth-user-create',
    'auth-user-enable',
    'auth-user-disable',
    'auth-roles',
    'auth-user-amend',
    'getRoles',
    'getUser',
    'removeRole',
    'contextUserRoles',
  ]

  getRoutes.map((route) =>
    it(`GET /api/${route} should go through error handler`, () =>
      request(app).get(`/api/${route}`).set('Accept', 'application/json').expect(500).expect('"Test error"'))
  )

  const queryRoutes = [
    { route: 'auth-user-search', query: { nameFilter: 'john doe' } },
    { route: 'auth-user-roles', query: { username: 'john doe' } },
    { route: 'auth-user-roles-remove', query: { role: 'admin' } },
  ]

  queryRoutes.map(({ route, query }) =>
    it(`GET /api/${route} should go through error handler`, () =>
      request(app)
        .get(`/api/${route}`)
        .query(query)
        .set('Accept', 'application/json')
        .expect(500)
        .expect('"Test error"'))
  )
})
