const { serviceUnavailableMessage } = require('../common-messages')
const contextProperties = require('../contextProperties')

const externalSearchFactory = (searchApi, searchUrl, maintainUrl, searchTitle, logError) => {
  const results = async (req, res) => {
    const { user } = req.query

    try {
      const searchResults = await searchApi(res.locals, user)
      res.render('externalSearchResults.njk', {
        searchTitle,
        searchUrl,
        maintainUrl,
        results: searchResults,
        ...contextProperties.getResponsePagination(res.locals),
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
