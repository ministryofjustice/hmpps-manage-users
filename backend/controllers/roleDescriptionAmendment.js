const { validateRoleDescription } = require('./roleValidation')
const { trimObjValues } = require('../utils')

const roleDescriptionAmendmentFactory = (getRoleDetailsApi, changeRoleDescriptionApi, manageRoleUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, roleDescription) => {
    req.flash('changeRoleErrors', errors)
    req.flash('changeRoleDescription', roleDescription)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { role } = req.params
    const roleUrl = `${manageRoleUrl}/${role}`

    const roleDetails = await getRoleDetailsApi(res.locals, role)
    const flashRole = req.flash('changeRoleDescription')
    const roleDescription = flashRole != null && flashRole.length > 0 ? flashRole[0] : roleDetails.roleDescription

    res.render('changeRoleDescription.njk', {
      title: `Change role description for ${roleDetails.roleName}`,
      roleUrl,
      currentRoleDescription: roleDescription,
      errors: req.flash('changeRoleErrors'),
    })
  }

  const post = async (req, res) => {
    const { role } = req.params
    const { roleDescription } = trimObjValues(req.body)
    const roleUrl = `${manageRoleUrl}/${role}`
    try {
      const errors = validateRoleDescription(roleDescription)
      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, [roleDescription])
      } else {
        await changeRoleDescriptionApi(res.locals, role, roleDescription)
        res.redirect(roleUrl)
      }
    } catch (err) {
      if (err.status === 400 && err.response && err.response.body) {
        const { error } = err.response.body

        const errors = [{ href: '#roleDescription', text: error }]
        stashStateAndRedirectToIndex(req, res, errors, [roleDescription])
      } else {
        throw err
      }
    }
  }

  return { index, post }
}

module.exports = {
  roleDescriptionAmendmentFactory,
}
