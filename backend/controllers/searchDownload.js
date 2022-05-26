const { Parser } = require('json2csv')
const logger = require('../log')
const { parseFilter } = require('./searchWithFilter')

const downloadFactory = (searchApi, json2CsvParse, allowDownload) => {
  const downloadResults = async (req, res) => {
    const { size, page, offset, ...parameters } = req.query

    if (!allowDownload(res)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      return res.end('You are not authorised to the resource')
    }

    const searchResults = await searchApi({
      locals: res.locals,
      ...parameters,
      pageNumber: 0,
      pageSize: 20000,
      pageOffset: 0,
    })

    try {
      const csv = json2CsvParse(searchResults)
      res.header('Content-Type', 'text/csv')
      res.attachment('user-search.csv')
      return res.send(csv)
    } catch (err) {
      logger.error(err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      return res.end('An error occurred while generating the download')
    }
  }

  return { downloadResults }
}

const downloadFactoryBetaSearch = (findUsersApi, allowDownload) => {
  const downloadBetaResults = async (req, res) => {
    const { size, page, offset, ...parameters } = req.query

    if (!allowDownload(res)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      return res.end('You are not authorised to the resource')
    }
    const currentFilter = parseFilter(req.query)

    const caseload = currentFilter.groupCode && currentFilter.groupCode[0]
    const { roleCode: accessRoles } = currentFilter
    const { searchResults } = await findUsersApi({
      locals: res.locals,
      user: parameters.user,
      caseload,
      accessRoles,
      activeCaseload: currentFilter.restrictToActiveGroup ? caseload : undefined,
      status: currentFilter.status,
      size,
      page,
    })
    const fields = [
      {
        label: 'staffId',
        value: 'staffId',
      },
      {
        label: 'username',
        value: 'username',
      },
      {
        label: 'firstName',
        value: 'firstName',
      },
      {
        label: 'lastName',
        value: 'lastName',
      },
      {
        label: 'activeCaseLoadId',
        value: 'activeCaseload.id',
      },
      {
        label: 'accountStatus',
        value: 'status',
      },
      {
        label: 'lockedFlag',
        value: 'locked',
      },
      {
        label: 'expiredFlag',
        value: 'expired',
      },
      {
        label: 'active',
        value: 'active',
      },
      {
        label: 'email',
        value: 'email',
      },
    ]

    const json2csvParser = new Parser({ fields })
    const csv = json2csvParser.parse(searchResults)
    try {
      res.header('Content-Type', 'text/csv')
      res.attachment('user-search.csv')
      return res.send(csv)
    } catch (err) {
      logger.error(err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      return res.end('An error occurred while generating the download')
    }
  }
  return { downloadBetaResults }
}

module.exports = {
  downloadFactory,
  downloadFactoryBetaSearch,
}
