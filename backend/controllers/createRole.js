const { validateCreateRole } = require('./roleValidation')

const createRoleFactory = (createRoleApi, manageRoleUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, role) => {
    req.flash('createRoleErrors', errors)
    req.flash('role', role)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const flashRole = req.flash('role')
    const role = flashRole != null && flashRole.length > 0 ? flashRole[0] : ''
    const roleUrl = manageRoleUrl

    // create map of all adminType and their status value
    const roleAminTypeMap = {
      DPS_ADM: role === '' ? false : role.adminType.includes('DPS_ADM'),
      DPS_LSA: role === '' ? false : role.adminType.includes('DPS_LSA'),
      EXT_ADM: role === '' ? false : role.adminType.includes('EXT_ADM'),
    }

    res.render('createRole.njk', {
      roleUrl,
      adminTypeMap: roleAminTypeMap,
      ...role,
      errors: req.flash('createRoleErrors'),
    })
  }

  const post = async (req, res) => {
    const role = req.body
    role.roleCode = role.roleCode.toUpperCase().trim()
    role.roleName = role.roleName.trim()

    if (role.adminType == null) {
      role.adminType = []
    } else {
      role.adminType = Array.isArray(role.adminType) ? role.adminType : [role.adminType]
    }

    const errors = validateCreateRole(role)

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [role])
    } else {
      try {
        await createRoleApi(res.locals, role)

        res.redirect(`${manageRoleUrl}/${role.roleCode}`)
      } catch (err) {
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
