const fsAsync = require('fs/promises')
const fs = require('fs')
const csv = require('csv-parser')
const config = require('../config').default

const createBulkUserRolesRequestsFactory = (getSearchableRolesApi) => {
  class ValidationError extends Error {
    constructor(message) {
      super(message)
      this.name = 'ValidationError'
    }
  }

  const getCreateNew = async (req, res) => {
    ensureBulkUserRolesRequestExists(req)
    res.render('createBulkUserRolesRequest.njk', { details: req.session.bulkUserRolesRequest })
  }

  const postJiraReference = async (req, res) => {
    const { jiraReference } = req.body || {}
    if (!jiraReference || jiraReference.trim().length === 0) {
      res.render('createBulkUserRolesRequest.njk', {
        jiraReferenceError: 'jira reference is required and cannot be empty',
      })
      return
    }
    req.session.bulkUserRolesRequest.jiraReference = jiraReference

    if (hasAllInputs(req)) {
      res.redirect('/change-roles-in-bulk/summary')
      return
    }

    req.session.bulkUserRolesRequest.dateRequested = Date()
    req.session.bulkUserRolesRequest.requestedBy = req.session.userDetails.username
    res.redirect('/change-roles-in-bulk/select-roles')
  }

  const getSelectRoles = async (req, res) => {
    const rolesList = await getRoles(res)
    const selectedRoles = req.session.bulkUserRolesRequest.roles ?? []

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

    req.session.bulkUserRolesRequest.roles = selectedRoles

    if (hasAllInputs(req)) {
      res.redirect('/change-roles-in-bulk/summary')
      return
    }

    res.redirect('/change-roles-in-bulk/upload-users')
  }

  const getUsersCsvUpload = async (req, res) => {
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
    } finally {
      await cleanUpResources(file)
    }

    req.session.bulkUserRolesRequest.users = userIds
    req.session.bulkUserRolesRequest.uploadFile = file.originalname
    res.redirect('/change-roles-in-bulk/summary')
  }

  const getBulkRequestSummary = async (req, res) => {
    const errors = getMissingFieldsErrors(req)
    const bulkRolesRequest = req.session.bulkUserRolesRequest
    const totalUsers = bulkRolesRequest?.users?.length || 0
    const totalRoles = bulkRolesRequest?.roles?.length || 0
    const summary = {
      requestedBy: req.session.userDetails.username,
      jiraReference: bulkRolesRequest?.jiraReference || 'N/A',
      roles: bulkRolesRequest?.roles || [],
      uploadFile: bulkRolesRequest?.uploadFile || 'N/A',
      numberOfUsers: totalUsers,
      totalAssignments: totalUsers * totalRoles,
    }
    if (errors !== null) {
      res.render('createBulkUserRolesSummary.njk', {
        summary,
        errors,
      })
      return
    }

    res.render('createBulkUserRolesSummary.njk', { summary })
  }

  const ensureBulkUserRolesRequestExists = (req) => {
    if (req.session?.bulkUserRolesRequest === undefined) {
      req.session.bulkUserRolesRequest = {}
    }
    if (req.session.bulkUserRolesRequest?.requestedBy === undefined) {
      const requestedBy = req.session?.userDetails?.username
      if (requestedBy === undefined || requestedBy === null) {
        throw new ValidationError('Username required for bulkUserRolesRequest but not found in session')
      }
      req.session.bulkUserRolesRequest.requestedBy = requestedBy
    }
  }

  const processCsvUpload = async (file) => {
    if (!file) {
      throw new ValidationError('file is required but was null')
    }
    if (!file.originalname.endsWith('.csv')) {
      throw new ValidationError('csv file is required')
    }

    return readCsv(file)
  }

  const cleanUpResources = async (file) => {
    try {
      if (file?.path !== undefined) {
        await fsAsync.unlink(file.path)
      }
    } catch (cleanupErr) {
      console.error('Cleanup failed:', cleanupErr)
    }
  }

  const readCsv = async (file) => {
    return new Promise((resolve, reject) => {
      const userIds = []

      fs.createReadStream(file.path)
        .pipe(csv())
        .on('headers', (headers) => {
          if (headers.length > 1) {
            reject(new ValidationError('csv file should contain single column "userId"'))
          }
        })
        .on('data', (row) => userIds.push(row))
        .on('end', () => {
          if (userIds.length === 0) {
            reject(new ValidationError('csv must contain at least 1 row'))
          }
          resolve(userIds.map((r) => r.userId))
        })
        .on('error', (err) => {
          reject(new ValidationError(err))
        })
    })
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

  const hasAllInputs = (req) => getMissingFieldsErrors(req) === null

  const getMissingFieldsErrors = (req) => {
    const errors = []
    const details = req.session.bulkUserRolesRequest

    if (details?.jiraReference === undefined || details.jiraReference.length === 0) {
      errors.push({ text: 'Jira reference is required', href: '#change-jira-ref' })
    }
    if (details?.users === undefined || details.users.length === 0) {
      errors.push({ text: 'Users is required', href: '#change-users-ref' })
    }
    if (details?.roles === undefined || details.roles.length === 0) {
      errors.push({ text: 'Roles is required', href: '#change-roles-ref' })
    }
    if (details?.uploadFile === undefined || details.uploadFile.length === 0) {
      errors.push({ text: 'Upload file is required', href: '#change-users-ref' })
    }

    return errors.length > 0 ? errors : null
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
    getUsersCsvUpload,
    postUserCsvUpload,
    getBulkRequestSummary,
  }
}

module.exports = { createBulkUserRolesRequestsFactory }
