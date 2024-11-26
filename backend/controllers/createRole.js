const { validateCreateRole } = require('./roleValidation')
const { audit, ManageUsersEvent } = require('../audit')
const cleanUpRedirect = require('../utils/urlUtils').default

const createRoleFactory = (createRoleApi, manageRoleUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, role) => {
    req.flash('createRoleErrors', errors)
    req.flash('role', role)
    res.redirect(cleanUpRedirect(req.originalUrl))
  }

  const index = async (req, res) => {
    const flashRole = req.flash('role')
    const role = flashRole != null && flashRole.length > 0 ? flashRole[0] : ''
    const roleUrl = manageRoleUrl

    const adminTypeValues = [
      { value: 'EXT_ADM', text: 'External Administrators' },
      { value: 'DPS_LSA', text: 'DPS Local System Administrators (LSA)' },
      { value: 'DPS_ADM', text: 'DPS Central Admin' },
    ]

    res.render('createRole.njk', {
      roleUrl,
      adminTypeValues,
      ...role,
      errors: req.flash('createRoleErrors'),
    })
  }

  const post = async (req, res) => {
    const role = req.body
    role.roleCode = role.roleCode.toUpperCase().trim().replace(/ROLE_/, '')
    role.roleName = role.roleName.trim()

    if (role.adminType == null) {
      role.adminType = []
    } else {
      role.adminType = Array.isArray(role.adminType) ? role.adminType : [role.adminType]
    }

    const errors = validateCreateRole(role)

    const sendAudit = audit(req.session.userDetails.username, { role })
    await sendAudit(ManageUsersEvent.CREATE_ROLE_ATTEMPT)
    if (errors.length > 0) {
      await sendAudit(ManageUsersEvent.CREATE_ROLE_FAILURE)
      stashStateAndRedirectToIndex(req, res, errors, [role])
    } else {
      try {
        await createRoleApi(res.locals, role)

        res.redirect(`${manageRoleUrl}/${role.roleCode}`)
      } catch (err) {
        await sendAudit(ManageUsersEvent.CREATE_ROLE_FAILURE)
        if (err.status === 409 && err.response && err.response.body) {
          //  role code already exists
          const roleError = [{ href: '#roleCode', text: 'Role code already exists' }]
          stashStateAndRedirectToIndex(req, res, roleError, [role])
        } else {
          throw err
        }
      }
    }
  }
  return { index, post }
}

module.exports = {
  createRoleFactory,
}
