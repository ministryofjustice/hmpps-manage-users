const { validateRoleName } = require('./roleValidation')
const { trimObjValues } = require('../utils')

const roleNameAmendmentFactory = (getRoleDetailsApi, changeRoleNameApi, manageRoleUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, roleName) => {
    req.flash('changeRoleErrors', errors)
    req.flash('changeRoleName', roleName)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { role } = req.params
    const roleUrl = `${manageRoleUrl}/${role}`

    const roleDetails = await getRoleDetailsApi(res.locals, role)
    const flashRole = req.flash('changeRoleName')
    const roleName = flashRole != null && flashRole.length > 0 ? flashRole[0] : roleDetails.roleName

    res.render('changeRoleName.njk', {
      title: `Change role name for ${roleDetails.roleName}`,
      roleUrl,
      currentRoleName: roleName,
      errors: req.flash('changeRoleErrors'),
    })
  }

  const post = async (req, res) => {
    const { role } = req.params
    const { roleName } = trimObjValues(req.body)
    const roleUrl = `${manageRoleUrl}/${role}`
    try {
      const errors = validateRoleName(roleName)
      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, [roleName])
      } else {
        await changeRoleNameApi(res.locals, role, roleName)
        res.redirect(roleUrl)
      }
    } catch (err) {
      if (err.status === 400 && err.response && err.response.body) {
        const { error } = err.response.body

        const errors = [{ href: '#roleName', text: error }]
        stashStateAndRedirectToIndex(req, res, errors, [roleName])
      } else if (err.status === 404 && err.response && err.response.body) {
        const { userMessage } = err.response.body

        const errors = [{ href: '#roleName', text: userMessage }]
        stashStateAndRedirectToIndex(req, res, errors, [roleName])
      } else {
        throw err
      }
    }
  }

  return { index, post }
}

module.exports = {
  roleNameAmendmentFactory,
}
