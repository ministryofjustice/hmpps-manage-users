const fsAsync = require('fs/promises')
const fs = require('fs')
const csv = require('csv-parser')
const { Readable } = require('stream')
const config = require('../config').default
const log = require('../log')

const createBulkUserRolesRequestsFactory = (getSearchableRolesApi, bulkUserRolesAdditions) => {
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
        maxSelections: config.app.maxBulkRolesSelection,
      })
      return
    }

    if (selectedRoles.length > config.app.maxBulkRolesSelection) {
      res.render('createBulkUserRolesSelectRoles.njk', {
        rolesList,
        selectedRoles,
        selectRolesError: `a maximum of ${config.app.maxBulkRolesSelection} roles can be selected`,
        maxSelections: config.app.maxBulkRolesSelection,
      })
      return
    }

    const invalidRoles = selectedRoles.filter((s) => !rolesList.some((r) => s === r.value))
    if (invalidRoles.length > 0) {
      res.render('createBulkUserRolesSelectRoles.njk', {
        rolesList,
        selectedRoles: selectedRoles.filter((r) => !invalidRoles.includes(r)),
        selectRolesError: `invalid role value selected ${invalidRoles.map((r) => r).join(', ')}`,
        maxSelections: config.app.maxBulkRolesSelection,
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
    let totalNumberOfUsers = 0

    try {
      totalNumberOfUsers = await processCsvUpload(file)
    } catch (err) {
      res.render('createBulkUserRolesUploadCsv.njk', {
        fileError: err.message,
        csrfToken: req.csrfToken(),
      })
      return
    }

    req.session.bulkUserRolesRequest.totalNumberOfUsers = totalNumberOfUsers
    req.session.bulkUserRolesRequest.usersFile = { filename: file.originalname, data: file.buffer }
    res.redirect('/change-roles-in-bulk/summary')
  }

  const getBulkRequestSummary = async (req, res) => {
    ensureBulkUserRolesRequestExists(req)

    const errors = validateAllFieldsPresent(req)
    const summary = getSummary(req)
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

    const { bulkUserRolesRequest } = req.session
    const bulkUserRolesAdditionsRequest = {
      jiraReference: bulkUserRolesRequest.jiraReference,
      roles: bulkUserRolesRequest.roles,
    }
    const fileInfo = bulkUserRolesRequest.usersFile

    try {
      await bulkUserRolesAdditions(res.locals, bulkUserRolesAdditionsRequest, fileInfo)
    } catch (err) {
      log.error('submit bulk user roles request unsuccessful', err)
      res.render('createBulkUserRolesSummary.njk', {
        summary: getSummary(req),
        submitRequestError: [{ text: 'Internal Server Error' }],
      })
      return
    }

    await deleteUploadFile(bulkUserRolesRequest.usersFile.path)
    delete req.session.bulkUserRolesRequest
    res.render('createBulkUserRolesConfirmation.njk', { jiraReference: bulkUserRolesRequest.jiraReference })
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

  const deleteUploadFile = async (path) => {
    try {
      if (path !== undefined) {
        log.info('deleting bulk user roles request file', path)
        await fsAsync.unlink(path)
      }
    } catch (cleanupErr) {
      log.error('upload file cleanup failed:', cleanupErr, path)
    }
  }

  const readCsv = async (file) => {
    return new Promise((resolve, reject) => {
      let userCount = 0
      let hasValidationError = false

      const { buffer } = file
      const fileStream = Readable.from(buffer)

      fileStream
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
          userCount += 1
        })
        .on('end', () => {
          if (hasValidationError) return

          if (userCount === 0) {
            hasValidationError = true
            reject(new ValidationError('csv must contain at least 1 row'))
            return
          }
          resolve(userCount)
        })
        .on('error', (err) => {
          reject(new ValidationError(err?.message() || String(err)))
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
    if (!details?.totalNumberOfUsers) {
      errors.push({ text: 'Users ids required', href: '#change-users-ref' })
    }
    if (!details?.roles || details?.roles?.length === 0) {
      errors.push({ text: 'Roles is required', href: '#change-roles-ref' })
    }
    if (!details?.usersFile?.data || details?.usersFile?.data?.length === 0) {
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

  const getSummary = (req) => {
    const bulkRolesRequest = req.session.bulkUserRolesRequest
    const totalUsers = bulkRolesRequest?.totalNumberOfUsers || 0
    const totalRoles = bulkRolesRequest?.roles?.length || 0

    return {
      requestedBy: req?.session?.userDetails?.username || 'N/A',
      jiraReference: bulkRolesRequest?.jiraReference || 'N/A',
      roles: bulkRolesRequest?.roles || [],
      uploadFile: bulkRolesRequest?.usersFile?.filename || 'N/A',
      totalNumberOfUsers: totalUsers,
      totalAssignments: totalUsers * totalRoles,
    }
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
