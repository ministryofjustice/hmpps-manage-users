const { validateRoleAdminType } = require('./roleValidation')

const roleAdminTypeAmendmentFactory = (getRoleDetailsApi, changeRoleAdminTypeApi, title, manageRoleUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, adminType) => {
    req.flash('changeRoleErrors', errors)
    req.flash('changeRoleAdminType', adminType)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const { role } = req.params
    const roleUrl = `${manageRoleUrl}/${role}`

    const roleDetails = await getRoleDetailsApi(res.locals, role)
    const flashRole = req.flash('changeRoleAdminType')
    const roleAdminType = flashRole != null && flashRole.length > 0 ? flashRole[0] : roleDetails.adminType

    // create map of all adminType and their status value
    const adminTypeList = roleAdminType.map((e) => e.adminTypeCode)
    const adminTypeMap = {
      DPS_ADM: adminTypeList.includes('DPS_ADM'),
      DPS_LSA: adminTypeList.includes('DPS_LSA'),
      EXT_ADM: adminTypeList.includes('EXT_ADM'),
    }

    res.render('changeRoleAdminType.njk', {
      title,
      roleUrl,
      currentRoleAdminType: adminTypeMap,
      errors: req.flash('changeRoleErrors'),
    })
  }

  const post = async (req, res) => {
    const { role } = req.params
    let { adminType } = req.body

    if (adminType == null) {
      adminType = []
    } else {
      adminType = Array.isArray(adminType) ? adminType : [adminType]
    }

    const roleUrl = `${manageRoleUrl}/${role}`
    try {
      const errors = validateRoleAdminType(adminType)
      if (errors.length > 0) {
        stashStateAndRedirectToIndex(req, res, errors, [adminType])
      } else {
        await changeRoleAdminTypeApi(res.locals, role, adminType)
        res.redirect(roleUrl)
      }
    } catch (err) {
      if (err.status === 400 && err.response && err.response.body) {
        const { error } = err.response.body

        const errors = [{ href: '#adminType', text: error }]
        stashStateAndRedirectToIndex(req, res, errors, adminType)
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
