const { serviceUnavailableMessage } = require('../common-messages')
const contextProperties = require('../contextProperties')

const externalSearchFactory = (paginationService, searchApi, searchUrl, maintainUrl, searchTitle, logError) => {
  const results = async (req, res) => {
    const { user, size, page, viewAll } = req.query

    const pageSize = (size && parseInt(size, 10)) || 20
    const pageNumber = (page && !viewAll && parseInt(page, 10)) || 0

    try {
      const searchResults = await searchApi(res.locals, user, pageNumber, pageSize)
      const pageResponse = contextProperties.getPageable(res.locals)

      res.render('externalSearchResults.njk', {
        searchTitle,
        searchUrl,
        maintainUrl,
        results: searchResults,
        pagination: paginationService.getPagination(
          pageResponse,
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
