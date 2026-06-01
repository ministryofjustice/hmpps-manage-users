import {
  bulkUserRolesReportsMap,
  bulkUserRolesRequestsList,
  getAggregatedResults,
} from '../utils/bulkUserRolesRequestStubs'

const viewBulkUserRolesRequestsFactory = () => {
  const viewBulkUserRolesRequests = async (req, res) => {
    const searchTerm = req.query.keyword || ''

    let bulkUserRolesRequests
    if (searchTerm) {
      bulkUserRolesRequests = bulkUserRolesRequestsList.filter((r) => {
        const target = searchTerm.toLowerCase()
        return r.jiraReference.toLowerCase().includes(target) || r.requestedBy.toLowerCase().includes(target)
      })
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
      aggregation: getAggregatedResults(),
      totalCount: report.length,
      unsuccessfulCount: report.filter((r) => r.status !== 200).length,
    }

    res.render('viewBulkUserRolesRequestDetails.njk', { details })
  }

  const downloadBulkUserRolesRequestReport = async (req, res) => {
    const id = req.params.id || ''
    const requestDetails = bulkUserRolesReportsMap().get(id)
    const header = 'User ID,Role Code,Status,Description\n'
    const rows = requestDetails
      .map((r) => {
        let result = 'success'
        switch (r.status) {
          case 200:
            result = 'success'
            break
          case 404:
            result = 'user not found'
            break
          case 409:
            result = 'role already assigned'
            break
          default:
            result = 'Error'
        }
        return `${r.user},${r.role},${r.status},${result}`
      })
      .join('\n')

    const csv = header + rows

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=bulk-user-roles-${id}.csv`)
    res.send(csv)
  }

  return { viewBulkUserRolesRequests, viewBulkUserRolesRequest, downloadBulkUserRolesRequestReport }
}

export default { viewBulkUserRolesRequestsFactory }
