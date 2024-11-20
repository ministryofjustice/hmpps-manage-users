const log = require('../log')

function sanitizeInput(input) {
  return String(input)
    .replace(/[\r\n]/g, '') // remove newline chars
    .replace(/[<>]/g, '') // remove or escape other unsafe characters
}

module.exports = function ensureSec(req, res, next) {
  if (req.secure) {
    next()
    return
  }

  const sanitizedHostname = sanitizeInput(req.hostname)
  const sanitizedUrl = sanitizeInput(req.url)
  const redirectUrl = `https://${sanitizedHostname}${sanitizedUrl}`

  log.info(`Redirecting to ${redirectUrl}`)
  res.redirect(redirectUrl)
}
