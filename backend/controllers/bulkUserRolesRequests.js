import { bulkUserRolesReportsMap, bulkUserRolesRequestsList } from '../utils/bulkUserRolesRequestStubs'

const fs = require('fs')
const fsAsync = require('fs/promises')

const bulkUserRolesRequestsFactory = (getSearchableRolesApi) => {
  class ValidationError extends Error {
    constructor(message) {
      super(message)
      this.name = 'ValidationError'
    }
  }

  const getCreateNew = async (req, res) => {
    req.session.bulkUserRoles = {}
    res.render('createBulkUserRolesRequest.njk')
  }

  const postReference = async (req, res) => {
    const { reference } = req.body || {}
    if (!reference) {
      res.render('createBulkUserRolesRequest.njk', {
        referenceError: 'reference is required and cannot be empty',
      })
      return
    }
    req.session.bulkUserRoles.reference = reference
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
    console.log(`request ${req.session.bulkUserRoles.reference} has been submitted`)
    const bulkRequest = req.session.bulkUserRoles
    delete req.session.bulkUserRoles
    res.render('createBulkUserRolesConfirmation.njk', { reference: bulkRequest.reference })
  }

  // TODO split this into separate router

  const viewBulkUserRolesRequests = async (req, res) => {
    const searchTerm = req.query.keyword || ''

    let bulkUserRolesRequests
    if (searchTerm) {
      bulkUserRolesRequests = bulkUserRolesRequestsList.filter((r) =>
        r.reference.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    } else {
      bulkUserRolesRequests = bulkUserRolesRequestsList
    }

    res.render('viewBulkUserRolesRequests.njk', { bulkUserRolesRequests })
  }

  const viewBulkUserRolesRequest = async (req, res) => {
    const id = req.params.id || ''
    const requestDetails = bulkUserRolesRequestsList.find((r) => r.id === id)

    const { roles, ...rest } = requestDetails

    const report = bulkUserRolesReportsMap().get(id)

    const details = {
      ...rest,
      roles: roles.map((r) => r.roleCode).join(', '),
      report,
      totalCount: report.length,
      unsuccessfulCount: report.filter((r) => r.status !== 200).length,
    }

    res.render('viewBulkUserRolesRequestDetails.njk', { details })
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
    postReference,
    getSelectRoles,
    postSelectRoles,
    getUserCsvUpload,
    postUserCsvUpload,
    getBulkRequestSummary,
    postBulkRequestSubmit,
    viewBulkUserRolesRequests,
    viewBulkUserRolesRequest,
  }
}

export default { bulkUserRolesRequestsFactory }
