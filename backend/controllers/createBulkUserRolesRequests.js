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

  return {
    getCreateNew,
    postJiraReference,
  }
}

module.exports = { createBulkUserRolesRequestsFactory }
