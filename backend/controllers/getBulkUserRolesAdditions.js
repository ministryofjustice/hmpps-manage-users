const log = require('../log')

const getBulkUserRolesAdditionsFactory = (bulkUserRolesAdditionsApi) => {
  const getBulkUserRolesAdditions = async (req, res) => {
    const searchTerm = req.query.keyword || ''

    let bulkUserRolesRequests
    try {
      log.info('search keyword:', searchTerm)
      bulkUserRolesRequests = await bulkUserRolesAdditionsApi.getAll(res.locals, searchTerm)
    } catch (err) {
      log.error('get bulk user roles requests unsuccessful', err)
      const errorMessage = err instanceof Error ? err.message : err
      res.render('viewBulkUserRolesRequests.njk', {
        getRequestsError: `API responded with: ${errorMessage}`,
      })
      return
    }
    res.render('viewBulkUserRolesRequests.njk', { bulkUserRolesRequests })
  }

  const getBulkUserRolesAdditionDetails = async (req, res) => {
    const { id } = req.params

    log.info('getBulkUserRolesAdditionDetails id:', id)

    let details
    try {
      details = await bulkUserRolesAdditionsApi.getById(res.locals, id)
    } catch (err) {
      log.error('get bulk user roles addition details unsuccessful', id, err)
      const errorMessage = err instanceof Error ? err.message : err
      res.render('viewBulkUserRolesRequestDetails.njk', {
        getRequestDetailsError: errorMessage,
      })
      return
    }
    res.render('viewBulkUserRolesRequestDetails.njk', { details })
  }

  return { getBulkUserRolesAdditions, getBulkUserRolesAdditionDetails }
}

module.exports = { getBulkUserRolesRequestsFactory: getBulkUserRolesAdditionsFactory }
