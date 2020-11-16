const { serviceUnavailableMessage } = require('../common-messages')

const selectGroupsFactory = (getGroups, logError) => {
  const index = async (req, res) => {
    try {
      const assignableGroups = await getGroups(res.locals)
      res.render('groups.njk', {
        groupValues: assignableGroups,
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: '/manage-groups' })
    }
  }

  return { index }
}

module.exports = {
  selectGroupsFactory,
}
