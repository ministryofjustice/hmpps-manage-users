const { serviceUnavailableMessage } = require('../common-messages')

const selectGroupsFactory = (getGroups, maintainUrl, logError) => {
  const index = async (req, res) => {
    try {
      const assignableGroups = await getGroups(res.locals)
      res.render('groups.njk', {
        groupValues: assignableGroups,
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
  selectGroupsFactory,
}
