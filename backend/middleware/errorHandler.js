const { serviceUnavailableMessage } = require('../common-messages')
const { logError } = require('../logError')

const errorHandler = (error, req, res, next) => {
  if (error.response.status === 404) {
    res.status(404)
    return res.render('notFound.njk')
  }

  logError(req.originalUrl, error, serviceUnavailableMessage)
  const pageData = {
    url: res.locals.redirectUrl || req.originalUrl,
  }
  res.status(500)
  return res.render('error.njk', pageData)
}

module.exports = errorHandler
