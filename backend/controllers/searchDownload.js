const logger = require('../log')

const downloadFactory = (searchApi, json2CsvParse) => {
  const downloadResults = async (req, res) => {
    const { user, groupCode, roleCode, status } = req.query

    const searchResults = await searchApi({
      locals: res.locals,
      user,
      groupCode,
      roleCode,
      status,
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
      res.writeHead(400, { 'Content-Type': 'text/plain' })
      return res.end('An error occurred while generating the download')
    }
  }

  return { downloadResults }
}

module.exports = {
  downloadFactory,
}
