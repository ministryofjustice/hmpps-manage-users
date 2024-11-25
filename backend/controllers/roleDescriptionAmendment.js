const { validateRoleDescription } = require('./roleValidation')
const { trimObjValues } = require('../utils/utils')
const { auditWithSubject, ManageUsersSubjectType, ManageUsersEvent } = require('../audit')
const cleanUpRedirect = require('../utils/urlUtils').default

const roleDescriptionAmendmentFactory = (getRoleDetailsApi, changeRoleDescriptionApi, manageRoleUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, roleDescription) => {
    req.flash('changeRoleErrors', errors)
    req.flash('changeRoleDescription', roleDescription)
    res.redirect(cleanUpRedirect(req.originalUrl))
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
    const sendAudit = auditWithSubject(req.session.userDetails.username, role, ManageUsersSubjectType.ROLE_CODE, {
      role,
      newRoleDescription: roleDescription,
    })
    await sendAudit(ManageUsersEvent.UPDATE_ROLE_ATTEMPT)
    try {
      const errors = validateRoleDescription(roleDescription)
      if (errors.length > 0) {
        await sendAudit(ManageUsersEvent.UPDATE_ROLE_FAILURE)
        stashStateAndRedirectToIndex(req, res, errors, [roleDescription])
      } else {
        await changeRoleDescriptionApi(res.locals, role, roleDescription)
        res.redirect(cleanUpRedirect(roleUrl))
      }
    } catch (err) {
      await sendAudit(ManageUsersEvent.UPDATE_ROLE_FAILURE)
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
