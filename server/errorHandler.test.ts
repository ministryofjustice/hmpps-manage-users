import type { Express, Request, Response } from 'express'
import request from 'supertest'
import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { appWithAllRoutes } from './routes/testutils/appSetup'
import createErrorHandler from './errorHandler'

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({})
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET 404', () => {
  it('should render content with stack in dev mode', () => {
    return request(app)
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('NotFoundError: Not Found')
        expect(res.text).not.toContain('Something went wrong. The error has been logged. Please try again')
      })
  })

  it('should render content without stack in production mode', () => {
    return request(appWithAllRoutes({ production: true }))
      .get('/unknown')
      .expect(404)
      .expect('Content-Type', /html/)
      .expect(res => {
        expect(res.text).toContain('Something went wrong. The error has been logged. Please try again')
        expect(res.text).not.toContain('NotFoundError: Not Found')
      })
  })
})

describe('API errors from hmpps-rest-client', () => {
  const apiError = (responseStatus: number): SanitisedError => {
    const error = new SanitisedError('API error')
    error.responseStatus = responseStatus
    return error
  }

  const mockResponse = () =>
    ({
      locals: {},
      redirect: jest.fn(),
      status: jest.fn(),
      render: jest.fn(),
    }) as unknown as Response

  const req = { originalUrl: '/some-page' } as Request

  it.each([401, 403])('should log the user out when the API responds with %s', responseStatus => {
    const res = mockResponse()

    createErrorHandler(false)(apiError(responseStatus), req, res, jest.fn())

    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
    expect(res.render).not.toHaveBeenCalled()
  })

  it('should use the API response status for other errors', () => {
    const res = mockResponse()

    createErrorHandler(false)(apiError(404), req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(404)
    expect(res.locals.status).toEqual(404)
    expect(res.render).toHaveBeenCalledWith('pages/error')
  })

  it('should default to 500 when there is no status', () => {
    const res = mockResponse()

    createErrorHandler(false)(new SanitisedError('boom'), req, res, jest.fn())

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
