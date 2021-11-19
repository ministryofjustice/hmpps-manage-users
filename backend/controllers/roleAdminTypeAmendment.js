const { validateRoleAdminType } = require('./roleValidation')

const adminTypeValues = [
  { value: 'EXT_ADM', text: 'External Administrators', immutable: true },
  { value: 'DPS_LSA', text: 'DPS Local System Administrators (LSA)', immutable: false },
  { value: 'DPS_ADM', text: 'DPS Central Admin', immutable: true },
]
const roleAdminTypeAmendmentFactory = (getRoleDetailsApi, changeRoleAdminTypeApi, manageRoleUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, roleAdminType) => {
    req.flash('changeRoleErrors', errors)
    req.flash('changeRoleAdminType', roleAdminType)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { role } = req.params
    const roleUrl = `${manageRoleUrl}/${role}`

    const roleDetails = await getRoleDetailsApi(res.locals, role)
    const flashRole = req.flash('changeRoleAdminType')
    const roleAdminType =
      flashRole != null && flashRole.length > 0 ? flashRole[0] : roleDetails.adminType.map((e) => e.adminTypeCode)

    res.render('changeRoleAdminType.njk', {
      title: `Change role admin type for ${roleDetails.roleName}`,
      roleUrl,
      adminTypeValues,
      currentFilter: roleAdminType,
      errors: req.flash('changeRoleErrors'),
    })
  }

  const maintainImmutableAdminTypes = (originalAdminType, amendedAdminType) => {
    const allImmutableAdminTypes = adminTypeValues.filter((item) => item.immutable).map((e) => e.value)
    const immutableAdminTypes = originalAdminType.filter((element) => allImmutableAdminTypes.includes(element))
    return amendedAdminType.concat(immutableAdminTypes)
  }

  const post = async (req, res) => {
    const { role } = req.params
    let { adminType } = req.body

    const originalRoleDetails = await getRoleDetailsApi(res.locals, role)
    const originalRoleAdminType = originalRoleDetails.adminType.map((e) => e.adminTypeCode)

    if (adminType == null) {
      adminType = []
    } else {
      adminType = Array.isArray(adminType) ? adminType : [adminType]
    }
    adminType = maintainImmutableAdminTypes(originalRoleAdminType, adminType)

    const roleUrl = `${manageRoleUrl}/${role}`
    try {
      const errors = validateRoleAdminType(adminType)
      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, adminType)
      } else {
        await changeRoleAdminTypeApi(res.locals, role, adminType)
        res.redirect(roleUrl)
      }
    } catch (err) {
      if (err.status === 400 && err.response && err.response.body) {
        const { error } = err.response.body

        const errors = [{ href: '#adminType', text: error }]
        stashStateAndRedirectToIndex(req, res, errors, [adminType])
      } else if (err.status === 404 && err.response && err.response.body) {
        const { userMessage } = err.response.body

        const errors = [{ href: '#adminType', text: userMessage }]
        stashStateAndRedirectToIndex(req, res, errors, [adminType])
      } else {
        throw err
      }
    }
  }

  return { index, post }
}

module.exports = {
  roleAdminTypeAmendmentFactory,
}
