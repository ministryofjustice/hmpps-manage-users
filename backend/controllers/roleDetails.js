const { auditWithSubject, ManageUsersSubjectType, ManageUsersEvent } = require('../audit')

const roleDetailsFactory = (getRoleDetailsApi, maintainUrl) => {
  const index = async (req, res) => {
    const { roleCode } = req.params
    const sendAudit = auditWithSubject(req.session.userDetails.username, roleCode, ManageUsersSubjectType.ROLE_CODE)
    await sendAudit(ManageUsersEvent.VIEW_ROLE_DETAILS_ATTEMPT)
    try {
      const roleDetails = await getRoleDetailsApi(res.locals, roleCode)
      res.render('roleDetails.njk', {
        roleDetails,
        maintainUrl,
        errors: req.flash('roleError'),
      })
    } catch (error) {
      await sendAudit(ManageUsersEvent.VIEW_ROLE_DETAILS_FAILURE)
      if (error.status === 404) {
        const roleError = [{ href: '#roleCode', text: 'Role does not exist' }]
        req.flash('roleError', roleError)
        res.redirect(maintainUrl)
      } else {
        throw error
      }
    }
  }

  return { index }
}

module.exports = {
  roleDetailsFactory,
}
