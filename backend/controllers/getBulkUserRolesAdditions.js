const log = require('../log')

const getBulkUserRolesAdditionsFactory = (
  bulkUserRolesAdditionsApi,
  paginationService,
  pagingApi,
  auditService,
  auditEvents,
) => {
  const getBulkUserRolesAdditions = async (req, res) => {
    const { size, page, keyword } = req.query

    const pageNumber = page ? parseInt(page, 10) : 0
    const pageSize = size ? parseInt(size, 10) : 20
    const searchTerm = keyword

    let bulkUserRolesRequests
    try {
      bulkUserRolesRequests = await bulkUserRolesAdditionsApi.getAll(res.locals, pageNumber, pageSize, searchTerm)
    } catch (err) {
      log.error('get bulk user roles requests unsuccessful', err)
      const errorMessage = err instanceof Error ? err.message : err
      res.render('viewBulkUserRolesRequests.njk', {
        getRequestsError: `API responded with: ${errorMessage}`,
      })
      return
    }

    res.render('viewBulkUserRolesRequests.njk', {
      bulkUserRolesRequests,
      pagination: paginationService.getPagination(
        pagingApi(res.locals),
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
    })
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

  const getResultsCsvDownload = async (req, res, next) => {
    const { id } = req.params
    log.info('getting csv download:', id)

    const sendAudit = auditService.audit(req.session.userDetails.username, { id })
    await sendAudit(auditEvents.BULK_USER_ROLES_ADDITION_DOWNLOAD_CSV_ATTEMPT)

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
      // An errored download will still download a file containing an error message to indicate there was a problem, the
      // error details are logged server side.
      res.status(200)
      res.set({
        'Content-Type': isError ? 'application/json' : upstream.headers['content-type'],
        'Content-Disposition': isError
          ? `attachment; filename="bulk-roles-assignments-${id}-ERROR.json"`
          : upstream.headers['content-disposition'],
      })
    })

    stream.on('end', async () => {
      if (isError) {
        await sendAudit(auditEvents.BULK_USER_ROLES_ADDITION_DOWNLOAD_CSV_FAILURE)
      }
    })

    await stream.pipe(res)
  }

  return { getBulkUserRolesAdditions, getBulkUserRolesAdditionDetails, getResultsCsvDownload }
}

module.exports = { getBulkUserRolesRequestsFactory: getBulkUserRolesAdditionsFactory }
