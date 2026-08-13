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

  const getResultsCsvDownload = (req, res, next) => {
    const { id } = req.params
    log.info('getting csv download:', id)

    const stream = bulkUserRolesAdditionsApi.getDownloadCsvStream(res.locals, id)
    let isError = false

    stream.on('error', (err) => {
      isError = true
      log.error(`error downloading bulk additions results csv id: ${id}`, err)
      if (!res.headersSent) {
        next(err)
      } else {
        res.destroy(err)
      }
    })

    stream.on('response', (upstream) => {
      if (upstream.statusCode >= 400) {
        isError = true
        let body = ''

        upstream.on('data', (chunk) => {
          body += chunk
        })

        upstream.on('end', () => {
          log.error(`error downloading bulk additions results csv id: ${id}`, {
            bulkAdditionsJobId: id,
            status: upstream.statusCode,
            body,
          })
        })
      }

      // Explicitly set status 200 for all requests including for errored downloads so the page doesn't load an error.
      // An errored download will still download a file containing an error message to indicate there was a problem, the error details are logged server side.
      res.status(200)
      res.set({
        'Content-Type': isError ? 'application/json' : upstream.headers['content-type'],
        'Content-Disposition': isError
          ? `attachment; filename="bulk-roles-assignments-${id}-ERROR.json"`
          : upstream.headers['content-disposition'],
      })
    })

    stream.pipe(res)
  }

  return { getBulkUserRolesAdditions, getBulkUserRolesAdditionDetails, getResultsCsvDownload }
}

module.exports = { getBulkUserRolesRequestsFactory: getBulkUserRolesAdditionsFactory }
