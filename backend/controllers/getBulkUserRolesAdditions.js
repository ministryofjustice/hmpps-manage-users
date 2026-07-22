const log = require('../log')

const getBulkUserRolesRequestsFactory = (bulkUserRolesAdditionsApi) => {
  const getBulkUserRolesRequests = async (req, res) => {
    const searchTerm = req.query.keyword || ''

    let bulkUserRolesRequests
    try {
      log.info('search keyword:', searchTerm)
      bulkUserRolesRequests = await bulkUserRolesAdditionsApi(res.locals, searchTerm)
    } catch (err) {
      log.error('get bulk user roles requests unsuccessful', err)
      res.render('viewBulkUserRolesRequests.njk', { getRequestsError: err })
      return
    }

    res.render('viewBulkUserRolesRequests.njk', { bulkUserRolesRequests })
  }

  // const viewBulkUserRolesRequest = async (req, res) => {
  //   const id = req.params.id || ''
  //   const requestDetails = bulkUserRolesRequestsList.find((r) => r.id === id)
  //
  //   const { roles, ...rest } = requestDetails
  //
  //   const report = bulkUserRolesReportsMap().get(id)
  //
  //   const details = {
  //     ...rest,
  //     roles: roles.map((r) => r.roleCode).join(', '),
  //     report,
  //     aggregation: getAggregatedResults(),
  //     totalCount: report.length,
  //     unsuccessfulCount: report.filter((r) => r.status !== 200).length,
  //   }
  //
  //   res.render('viewBulkUserRolesRequestDetails.njk', { details })
  // }

  // const downloadBulkUserRolesRequestReport = async (req, res) => {
  //   const id = req.params.id || ''
  //   const requestDetails = bulkUserRolesReportsMap().get(id)
  //   const header = 'User ID,Role Code,Status,Description\n'
  //   const rows = requestDetails
  //     .map((r) => {
  //       let result = 'success'
  //       switch (r.status) {
  //         case 200:
  //           result = 'success'
  //           break
  //         case 404:
  //           result = 'user not found'
  //           break
  //         case 409:
  //           result = 'role already assigned'
  //           break
  //         default:
  //           result = 'Error'
  //       }
  //       return `${r.user},${r.role},${r.status},${result}`
  //     })
  //     .join('\n')
  //
  //   const csv = header + rows
  //
  //   res.setHeader('Content-Type', 'text/csv')
  //   res.setHeader('Content-Disposition', `attachment; filename=bulk-user-roles-${id}.csv`)
  //   res.send(csv)
  // }

  return { getBulkUserRolesRequests }
}

module.exports = { getBulkUserRolesRequestsFactory }
