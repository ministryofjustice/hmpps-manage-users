const config = require('../config').default

const createBulkUserRolesRequestsFactory = (getSearchableRolesApi) => {
  const getCreateNew = async (req, res) => {
    if (req.session?.bulkUserRoles === undefined) {
      req.session.bulkUserRoles = {}
    }
    res.render('createBulkUserRolesRequest.njk', { details: req.session.bulkUserRoles })
  }

  const postJiraReference = async (req, res) => {
    const { jiraReference } = req.body || {}
    if (!jiraReference || jiraReference.trim().length === 0) {
      res.render('createBulkUserRolesRequest.njk', {
        jiraReferenceError: 'jira reference is required and cannot be empty',
      })
      return
    }
    req.session.bulkUserRoles.jiraReference = jiraReference

    if (hasAllInputs(req)) {
      res.redirect('/change-roles-in-bulk/summary')
      return
    }

    req.session.bulkUserRoles.dateRequested = Date()
    req.session.bulkUserRoles.requestedBy = req.session.userDetails.username
    res.redirect('/change-roles-in-bulk/select-roles')
  }

  const getSelectRoles = async (req, res) => {
    const rolesList = await getRoles(res)
    const selectedRoles = req.session.bulkUserRoles.roles ?? []

    res.render('createBulkUserRolesSelectRoles.njk', {
      rolesList,
      selectedRoles,
      maxSelections: config.app.maxBulkRolesSelection,
    })
  }

  const postSelectRoles = async (req, res) => {
    const rolesList = await getRoles(res)
    const selectedRoles = getSelectedRolesFromRequest(req)

    if (!selectedRoles || !selectedRoles.length) {
      res.render('createBulkUserRolesSelectRoles.njk', {
        rolesList,
        selectedRoles: [],
        selectRolesError: 'at least one role must be selected',
      })
      return
    }

    if (selectedRoles.length > config.app.maxBulkRolesSelection) {
      res.render('createBulkUserRolesSelectRoles.njk', {
        rolesList,
        selectedRoles,
        selectRolesError: `a maximum of ${config.app.maxBulkRolesSelection} roles can be selected`,
      })
      return
    }

    const invalidRoles = selectedRoles.filter((s) => !rolesList.some((r) => s === r.value))
    if (invalidRoles.length > 0) {
      res.render('createBulkUserRolesSelectRoles.njk', {
        rolesList,
        selectedRoles: selectedRoles.filter((r) => !invalidRoles.includes(r)),
        selectRolesError: `invalid role value selected ${invalidRoles.map((r) => r).join(', ')}`,
      })
      return
    }

    req.session.bulkUserRoles.roles = selectedRoles

    if (hasAllInputs(req)) {
      res.redirect('/change-roles-in-bulk/summary')
      return
    }

    res.redirect('/change-roles-in-bulk/upload-users')
  }

  const getSelectedRolesFromRequest = (req) => {
    const { selectedRoles } = req?.body || {}
    if (selectedRoles === undefined) {
      return undefined
    }
    if (Array.isArray(selectedRoles)) {
      return selectedRoles
    }
    return [selectedRoles]
  }

  const hasAllInputs = (req) => {
    const details = req.session.bulkUserRoles
    return (
      details?.dateRequested !== undefined &&
      details?.jiraReference?.length > 0 &&
      details?.requestedBy?.length > 0 &&
      details?.users?.length > 0 &&
      details?.roles?.length > 0 &&
      details?.uploadFile?.length > 0
    )
  }

  const getRoles = async (res) => {
    const roles = await getSearchableRolesApi(res.locals)
    return roles.map((r) => ({
      text: r.roleName,
      value: r.roleCode,
    }))
  }

  return {
    getCreateNew,
    postJiraReference,
    getSelectRoles,
    postSelectRoles,
  }
}

module.exports = { createBulkUserRolesRequestsFactory }
