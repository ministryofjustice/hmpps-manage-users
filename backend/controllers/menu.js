const config = require('../config')

const menuFactory = (prisonApi, logError) => {
  const index = async (req, res) => {
    try {
      res.render('menu.njk', {
        title: 'Manage user accounts',
        homeUrl: config.app.notmEndpointUrl,
        contentUrl: `${config.app.dpsEndpointUrl}/content`,
        user: {
          displayName: req.session.userDetails.name,
          ...req.session.userRoles,
        },
      })
    } catch (error) {
      logError(req.originalUrl, error, 'Sorry, the service is unavailable')
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
