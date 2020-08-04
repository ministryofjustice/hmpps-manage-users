const { logger } = require('./log')
const contextProperties = require('./contextProperties')
const errorStatusCode = require('./error-status-code')

const extractRequestPaginationMiddleware = (req, res, next) => {
  contextProperties.setRequestPagination(res.locals, req.headers)
  next()
}

const setPagingHeaders = (context, res) => {
  res.set(contextProperties.getResponsePagination(context))
}

const sendJsonResponse = (res) => (data) => {
  setPagingHeaders(res.locals, res)
  res.json(data)
}

const handleErrors = (res) => (error) => {
  logger.error(error)

  res.status(errorStatusCode(error))

  if (error.response && error.response.body) {
    res.json({
      message: error.response.body.userMessage,
    })
  } else {
    res.end()
  }
}

const forwardingHandlerFactory = (prisonApi) =>
  /**
   * Forward the incoming request using the prisonApi get and post functions.
   * @param req
   * @param res
   * @returns {*}
   */
  (req, res) => {
    // const sendJsonResponse = data => {
    //   setPagingHeaders(res.locals, res);
    //   res.json(data);
    // };

    const theUrl = `/api${req.url}`

    switch (req.method) {
      case 'GET':
        return prisonApi.get(res.locals, theUrl).then(sendJsonResponse(res)).catch(handleErrors(res))

      case 'POST':
        return prisonApi.post(res.locals, theUrl, req.body).then(sendJsonResponse(res)).catch(handleErrors(res))

      case 'PUT':
        return prisonApi.put(res.locals, theUrl, req.body).then(sendJsonResponse(res)).catch(handleErrors())

      default:
        throw new Error(`Unsupported request method ${req.method}`)
    }
  }

module.exports = {
  extractRequestPaginationMiddleware,
  forwardingHandlerFactory,
}
