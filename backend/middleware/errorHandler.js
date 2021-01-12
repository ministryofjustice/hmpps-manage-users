const { serviceUnavailableMessage } = require('../common-messages')
const { logError } = require('../logError')

const errorHandler = (error, req, res, next) => {
  logError(req.originalUrl, error, serviceUnavailableMessage)
  const pageData = {
    url: res.locals.redirectUrl || req.originalUrl,
  }
  res.status(500)
  res.render('error.njk', pageData)
}

module.exports = errorHandler
