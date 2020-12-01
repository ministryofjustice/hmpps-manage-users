const { serviceUnavailableMessage } = require('../common-messages')
const contextProperties = require('../contextProperties')

const externalSearchFactory = (paginationService, searchApi, searchUrl, maintainUrl, searchTitle, logError) => {
  const results = async (req, res) => {
    const { user, limit, offset, viewAll } = req.query

    const pageLimit = (limit && parseInt(limit, 10)) || 20
    const pageOffset = (offset && !viewAll && parseInt(offset, 10)) || 0

    try {
      const searchResults = await searchApi(res.locals, user, pageOffset, pageLimit)
      const page = contextProperties.getResponsePagination(res.locals)

      res.render('externalSearchResults.njk', {
        searchTitle,
        searchUrl,
        maintainUrl,
        results: searchResults,
        ...page,
        pagination: paginationService.getPagination(
          page['total-records'],
          pageOffset,
          pageLimit,
          new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`)
        ),
        errors: req.flash('errors'),
      })
    } catch (error) {
      logError(req.originalUrl, error, serviceUnavailableMessage)
      res.render('error.njk', { url: searchUrl })
    }
  }

  return { results }
}

module.exports = {
  externalSearchFactory,
}
