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

  return { getBulkUserRolesAdditions }
}

module.exports = { getBulkUserRolesRequestsFactory: getBulkUserRolesAdditionsFactory }
