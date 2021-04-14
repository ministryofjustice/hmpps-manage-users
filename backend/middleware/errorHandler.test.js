jest.mock('../logError', () => ({
  logError: jest.fn(),
}))

const errorHandler = require('./errorHandler')
const { logError } = require('../logError')
const { serviceUnavailableMessage } = require('../common-messages')

describe('Error handling middleware', () => {
  const req = {
    originalUrl: 'http://localhost',
  }
  const res = {
    status: jest.fn(),
    render: jest.fn(),
  }
  const error = { ...new Error('error message'), status: 500, response: { body: { error_description: 'not valid' } } }

  const handleErrorWhenRetryLinkIs = (redirectUrl) => errorHandler(error, req, { ...res, locals: { redirectUrl } })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should log an error when an error is thrown', async () => {
    errorHandler(error, req, { ...res, locals: { redirectUrl: '/prisoner-search' } })

    expect(logError).toHaveBeenCalledWith(req.originalUrl, error, serviceUnavailableMessage)
  })

  it('should handle an error when the retry link is overridden', async () => {
    handleErrorWhenRetryLinkIs('/bookings')

    expect(res.render).toHaveBeenCalledWith('error.njk', { url: '/bookings' })
  })

  it('should handle an error when there is no retry link', async () => {
    handleErrorWhenRetryLinkIs(null)

    expect(res.render).toHaveBeenCalledWith('error.njk', { url: 'http://localhost' })
  })

  it('should produce a 500 status code when an error is thrown', async () => {
    errorHandler(error, req, { ...res, locals: { redirectUrl: '/prisoner-search' } })

    expect(res.status).toHaveBeenCalledWith(500)
  })
})
