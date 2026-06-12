const fsAsync = require('fs/promises')
const fs = require('fs')
const csv = require('csv-parser')
const config = require('../config').default

const createBulkUserRolesRequestsFactory = (getSearchableRolesApi, bulkUserRolesApi) => {
  class ValidationError extends Error {
    constructor(message) {
      super(message)
      this.name = 'ValidationError'
    }
  }

  const ensureBulkUserRolesRequestExists = (req) => {
    if (req.session?.bulkUserRolesRequest === undefined) {
      req.session.bulkUserRolesRequest = {}
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
    ensureBulkUserRolesRequestExists(req)
    req.session.bulkUserRolesRequest.jiraReference = jiraReference

    if (hasAllInputs(req)) {
      res.redirect('/change-roles-in-bulk/summary')
      return
    }

    res.redirect('/change-roles-in-bulk/select-roles')
  }

  const getSelectRoles = async (req, res) => {
    ensureBulkUserRolesRequestExists(req)
    const rolesList = await getRoles(res.locals)
    const selectedRoles = req.session.bulkUserRolesRequest.roles ?? []

    res.render('createBulkUserRolesSelectRoles.njk', {
      rolesList,
      selectedRoles,
      maxSelections: config.app.maxBulkRolesSelection,
    })
  }

  const postSelectRoles = async (req, res) => {
    ensureBulkUserRolesRequestExists(req)
    const rolesList = await getRoles(res.locals)
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
    ensureBulkUserRolesRequestExists(req)
    res.render('createBulkUserRolesUploadCsv.njk')
  }

  const postUserCsvUpload = async (req, res) => {
    ensureBulkUserRolesRequestExists(req)
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
    ensureBulkUserRolesRequestExists(req)

    const errors = validateAllFieldsPresent(req)
    const bulkRolesRequest = req.session.bulkUserRolesRequest
    const totalUsers = bulkRolesRequest?.users?.length || 0
    const totalRoles = bulkRolesRequest?.roles?.length || 0
    const summary = {
      requestedBy: getRequestedBy(req),
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

  const postSubmitBulkUserRolesRequest = async (req, res) => {
    ensureBulkUserRolesRequestExists(req)

    if (!hasAllInputs(req)) {
      res.redirect('/change-roles-in-bulk/summary')
      return
    }

    req.session.bulkUserRolesRequest.requestedBy = getRequestedBy(req)
    req.session.bulkUserRolesRequest.dateRequested = new Date()

    const summary = req.session.bulkUserRolesRequest

    try {
      await bulkUserRolesApi(res.locals, summary)
    } catch (err) {
      console.error('submit bulk user roles request unsuccessful', err)
      res.render('createBulkUserRolesSummary.njk', { errors: [{ text: 'failed to submit request' }] })
      return
    }

    delete req.session.bulkUserRolesRequest
    res.render('createBulkUserRolesConfirmation.njk', { jiraReference: summary.jiraReference })
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
      console.error('upload file cleanup failed:', cleanupErr)
    }
  }

  const readCsv = async (file) => {
    return new Promise((resolve, reject) => {
      const userIds = []
      let hasValidationError = false

      fs.createReadStream(file.path)
        .pipe(csv())
        .on('headers', (headers) => {
          if (hasValidationError) return

          if (headers.length > 1 || headers[0] !== 'userId') {
            hasValidationError = true
            reject(new ValidationError('csv file should contain single column with header "userId"'))
          }
        })
        .on('data', (row) => {
          if (hasValidationError) return
          const userId = row?.userId

          if (!userId || userId?.length === 0 || userId?.trim().length === 0) {
            hasValidationError = true
            reject(new ValidationError('each row must contain a non null non empty userId'))
            return
          }
          userIds.push(userId.trim())
        })
        .on('end', () => {
          if (hasValidationError) return

          if (userIds.length === 0) {
            reject(new ValidationError('csv must contain at least 1 row'))
          }
          resolve(userIds)
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

  const hasAllInputs = (req) => validateAllFieldsPresent(req) === null

  const validateAllFieldsPresent = (req) => {
    const errors = []
    const details = req.session.bulkUserRolesRequest

    if (!details?.jiraReference || details.jiraReference?.length === 0) {
      errors.push({ text: 'Jira reference is required', href: '#change-jira-ref' })
    }
    if (!details?.users || details?.users?.length === 0) {
      errors.push({ text: 'Users is required', href: '#change-users-ref' })
    }
    if (!details?.roles || details?.roles?.length === 0) {
      errors.push({ text: 'Roles is required', href: '#change-roles-ref' })
    }
    if (!details?.uploadFile || details?.uploadFile?.length === 0) {
      errors.push({ text: 'Upload file is required', href: '#change-users-ref' })
    }

    return errors.length > 0 ? errors : null
  }

  const getRoles = async (context) => {
    const roles = await getSearchableRolesApi(context)
    return roles.map((r) => ({
      text: r.roleName,
      value: r.roleCode,
    }))
  }

  const getRequestedBy = (req) => {
    if (!req?.session?.userDetails || !req?.session?.userDetails?.username) {
      throw new Error('unable to get username from session')
    }
    return req.session.userDetails.username
  }

  return {
    getCreateNew,
    postJiraReference,
    getSelectRoles,
    postSelectRoles,
    getUsersCsvUpload,
    postUserCsvUpload,
    getBulkRequestSummary,
    postSubmitBulkUserRolesRequest,
  }
}

module.exports = { createBulkUserRolesRequestsFactory }
