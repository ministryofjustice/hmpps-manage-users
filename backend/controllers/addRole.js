const { serviceUnavailableMessage } = require('../common-messages')

const maintainUrl = '/maintain-auth-users'

const addRoleFactory = (oauthApi, prisonApi, logError) => {
  const addRole = async (req, res) => {
    const { agencyId, username, roleCode } = req.query
    await prisonApi.addRole(res.locals, agencyId, username, roleCode)
    res.json({})
  }

  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('addRoleErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { username } = req.params
    const staffUrl = `${maintainUrl}/${username}`

    try {
      const [assignableRoles, user] = await Promise.all([
        oauthApi.assignableRoles(res.locals, { username }),
        oauthApi.getUser(res.locals, { username }),
      ])
      const roleDropdownValues = assignableRoles.map((r) => ({
        text: r.roleName,
        value: r.roleCode,
      }))

      res.render('addRole.njk', {
        maintainTitle: 'Maintain auth users',
        maintainUrl,
        staff: { username: user.username, name: `${user.firstName} ${user.lastName}` },
        staffUrl,
        roleDropdownValues,
        errors: req.flash('addRoleErrors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: staffUrl })
    }
  }

  const post = async (req, res) => {
    const { username } = req.params
    const { roles } = req.body
    const staffUrl = `${maintainUrl}/${username}`

    try {
      if (!roles) {
        const errors = [{ href: '#roles', text: 'Select at least one role' }]
        stashStateAndRedirectToIndex(req, res, errors)
      } else {
        const roleArray = Array.isArray(roles) ? roles : [roles]
        await oauthApi.addUserRoles(res.locals, { username, roles: roleArray })
        res.redirect(staffUrl)
      }
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: `${staffUrl}/select-roles` })
    }
  }

  return { addRole, index, post }
}

module.exports = {
  addRoleFactory,
}
