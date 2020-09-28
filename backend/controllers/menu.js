const { serviceUnavailableMessage } = require('../common-messages')

const menuFactory = (logError) => {
  const index = async (req, res) => {
    try {
      res.render('menu.njk')
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', {
        url: '/menu',
      })
    }
  }

  return { index }
}

module.exports = {
  menuFactory,
}
