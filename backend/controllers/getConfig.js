const config = require('../config')

const getConfiguration = async (req, res) =>
  res.json({
    notmEndpointUrl: config.app.notmEndpointUrl,
    dpsEndpointUrl: config.app.dpsEndpointUrl,
    supportUrl: config.app.supportUrl,
    googleAnalyticsId: config.analytics.googleAnalyticsId,
  })

module.exports = {
  getConfiguration,
}
