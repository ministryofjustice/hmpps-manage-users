import { bulkUserRolesReportsMap, bulkUserRolesRequestsList } from '../utils/bulkUserRolesRequestStubs'

// TODO - POC doesnt persist inputted values through flow

const bulkUserRolesRequestsFactory = (getSearchableRolesApi) => {
  const getCreateNew = async (req, res) => {
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

    res.redirect('/change-roles-in-bulk/upload-users')
  }

  const getUserCsvUpload = async (req, res) => {
    // eslint-disable-next-line no-underscore-dangle
    console.log('csrf token:', res.locals._csrf)
    res.render('createBulkUserRolesUploadCsv.njk')
  }

  const postUserCsvUpload = async (req, res) => {
    console.log('upload controller...')
    if (!req.file) {
      console.log('file is required but was null')
      res.render('createBulkUserRolesUploadCsv.njk', { fileError: 'file is required but was null' })
      return
    }

    res.render('createBulkUserRolesSummary.njk')
  }

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
    viewBulkUserRolesRequests,
    viewBulkUserRolesRequest,
  }
}

export default { bulkUserRolesRequestsFactory }
