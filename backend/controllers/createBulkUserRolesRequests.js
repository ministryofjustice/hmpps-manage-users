const fs = require('fs')
const fsAsync = require('fs/promises')

const createBulkUserRolesRequestsFactory = (getSearchableRolesApi) => {
  class ValidationError extends Error {
    constructor(message) {
      super(message)
      this.name = 'ValidationError'
    }
  }

  const getCreateNew = async (req, res) => {
    if (req.session.bulkUserRoles === undefined) {
      req.session.bulkUserRoles = {}
    }
    res.render('createBulkUserRolesRequest.njk')
  }

  const postJiraReference = async (req, res) => {
    const { jiraReference } = req.body || {}
    if (!jiraReference) {
      res.render('createBulkUserRolesRequest.njk', {
        jiraReferenceError: 'jira reference is required and cannot be empty',
      })
      return
    }

    req.session.bulkUserRoles.jiraReference = jiraReference
    req.session.bulkUserRoles.dateRequested = Date()
    req.session.bulkUserRoles.requestedBy = req.session.userDetails.username
    res.redirect('/change-roles-in-bulk/select-roles')
  }

  const getSelectRoles = async (req, res) => {
    const rolesList = await getRoles(res)
    const selectedRoles = []

    res.render('createBulkUserRolesSelectRoles.njk', { rolesList, selectedRoles })
  }

  const postSelectRoles = async (req, res) => {
    const { selectedRoles } = req.body || {}
    console.log(selectedRoles)

    if (!selectedRoles || !selectedRoles.length) {
      const rolesList = await getRoles(res)

      res.render('createBulkUserRolesSelectRoles.njk', {
        rolesList,
        selectRolesError: 'at least one role must be selected',
      })
      return
    }

    req.session.bulkUserRoles.roles = selectedRoles
    console.log(req.session.bulkUserRoles)
    res.redirect('/change-roles-in-bulk/upload-users')
  }

  const getUserCsvUpload = async (req, res) => {
    res.render('createBulkUserRolesUploadCsv.njk')
  }

  const postUserCsvUpload = async (req, res) => {
    const { file } = req
    let userIds

    try {
      userIds = await processCsvUpload(file)
    } catch (err) {
      res.render('createBulkUserRolesUploadCsv.njk', {
        fileError: err.message,
        csrfToken: req.csrfToken(),
      })
      return
    }

    req.session.bulkUserRoles.users = userIds
    res.redirect('/change-roles-in-bulk/summary')
  }

  const processCsvUpload = async (file) => {
    let userIds
    try {
      validateFile(file)
      userIds = readUserIdsFromCsv(file)
    } finally {
      try {
        console.log(`deleting temp file ${file.path}`)
        await fsAsync.unlink(file.path)
        console.log(`deleted ${file.path}`)
      } catch (cleanupErr) {
        console.error('Cleanup failed:', cleanupErr)
      }
    }
    return userIds
  }

  const validateFile = (file) => {
    if (!file) {
      throw new ValidationError('file is required but was null')
    }

    if (!file.originalname.endsWith('.csv')) {
      throw new ValidationError('csv file is required')
    }
  }

  const readUserIdsFromCsv = async (file) => {
    const csv = fs.readFileSync(file.path, 'utf8')
    const userIds = csv.split('\n').map((line) => line.split(','))
    if (userIds.length === 0) {
      throw new ValidationError('at least 1 user id is required')
    }
    return userIds
  }

  const getBulkRequestSummary = async (req, res) => {
    res.render('createBulkUserRolesSummary.njk', {
      summary: req.session.bulkUserRoles,
    })
  }

  const postBulkRequestSubmit = async (req, res) => {
    console.log(`request ${req.session.bulkUserRoles.jiraReference} has been submitted`)
    const bulkRequest = req.session.bulkUserRoles
    delete req.session.bulkUserRoles
    res.render('createBulkUserRolesConfirmation.njk', { jiraReference: bulkRequest.jiraReference })
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
    getUserCsvUpload,
    postUserCsvUpload,
    getBulkRequestSummary,
    postBulkRequestSubmit,
  }
}

export default { createBulkUserRolesRequestsFactory }
