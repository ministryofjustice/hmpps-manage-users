const { serviceUnavailableMessage } = require('../common-messages')

const groupDetailsFactory = (getGroupDetailsApi, maintainUrl, logError) => {
  const index = async (req, res) => {
    const { group } = req.params
    try {
      const groupDetails = await getGroupDetailsApi(res.locals, group)

      res.render('groupDetails.njk', {
        groupDetails,
        maintainUrl,
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: maintainUrl })
    }
  }

  return { index }
}

module.exports = {
  groupDetailsFactory,
}
