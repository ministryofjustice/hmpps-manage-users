const logger = require('../log')

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
      pageSize: 10000,
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

module.exports = {
  downloadFactory,
}
