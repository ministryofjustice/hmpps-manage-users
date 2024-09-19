const { Parser } = require('json2csv')
const unwind = require('json2csv/lib/transforms/unwind')
const logger = require('../log')
const { parseFilter } = require('./searchDpsUsers')
const { audit, ManageUsersEvent } = require('../audit')

const downloadFactory = (searchApi, json2CsvParse, allowDownload) => {
  const downloadResults = async (req, res) => {
    const { ...parameters } = req.query
    const sendAudit = audit(req.session.userDetails.username, {
      authSource: 'external',
      report: 'user-search',
      query: parameters,
    })
    await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT)

    if (!allowDownload(res)) {
      await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_FAILURE)
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      return res.end('You are not authorised to the resource')
    }

    try {
      const searchResults = await searchApi({
        locals: res.locals,
        ...parameters,
        pageNumber: 0,
        pageSize: 20000,
        pageOffset: 0,
      })

      const csv = json2CsvParse(searchResults)
      res.header('Content-Type', 'text/csv')
      res.attachment('user-search.csv')
      return res.send(csv)
    } catch (err) {
      await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_FAILURE)
      logger.error(err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      return res.end('An error occurred while generating the download')
    }
  }

  return { downloadResults }
}

const downloadFactoryBetaSearch = (downloadUserSearch, allowDownload) => {
  const downloadBetaResults = async (req, res) => {
    const { ...parameters } = req.query
    const sendAudit = audit(req.session.userDetails.username, {
      authSource: 'nomis',
      report: 'user-search',
      query: parameters,
    })
    await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT)

    if (!allowDownload(res)) {
      await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_FAILURE)
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      return res.end('You are not authorised to the resource')
    }
    const currentFilter = parseFilter(req.query)

    const caseload = currentFilter.groupCode && currentFilter.groupCode[0]
    const { roleCode: accessRoles } = currentFilter

    try {
      const { searchResults } = await downloadUserSearch({
        locals: res.locals,
        user: parameters.user,
        caseload,
        accessRoles,
        activeCaseload: currentFilter.restrictToActiveGroup ? caseload : undefined,
        status: currentFilter.status,
        inclusiveRoles: currentFilter.inclusiveRoles,
        showOnlyLSAs: currentFilter.showOnlyLSAs,
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
        {
          label: 'dpsRoleCount',
          value: 'dpsRoleCount',
        },
      ]

      const json2csvParser = new Parser({ fields })
      const csv = json2csvParser.parse(searchResults)
      res.header('Content-Type', 'text/csv')
      res.attachment('user-search.csv')
      return res.send(csv)
    } catch (err) {
      await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_FAILURE)
      logger.error(err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      return res.end('An error occurred while generating the download')
    }
  }
  return { downloadBetaResults }
}

const downloadFactoryLsaSearch = (downloadLsaSearch, allowDownload) => {
  const downloadLsaResults = async (req, res) => {
    const { ...parameters } = req.query
    const sendAudit = audit(req.session.userDetails.username, {
      authSource: 'nomis',
      report: 'lsa-report',
      query: parameters,
    })
    await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT)

    if (!allowDownload(res)) {
      await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_FAILURE)
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      return res.end('You are not authorised to the resource')
    }

    const currentFilter = parseFilter(req.query)
    const caseload = currentFilter.groupCode && currentFilter.groupCode[0]
    const { roleCode: accessRoles } = currentFilter

    try {
      const { searchResults } = await downloadLsaSearch({
        locals: res.locals,
        user: parameters.user,
        caseload,
        accessRoles,
        activeCaseload: currentFilter.restrictToActiveGroup ? caseload : undefined,
        status: currentFilter.status,
        inclusiveRoles: currentFilter.inclusiveRoles,
        showOnlyLSAs: currentFilter.showOnlyLSAs,
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
          label: 'email',
          value: 'email',
        },
        {
          label: 'dpsRoleCount',
          value: 'dpsRoleCount',
        },
        {
          label: 'lsaCaseloadId',
          value: 'groups.id',
        },
        {
          label: 'lsaCaseload',
          value: 'groups.name',
        },
      ]
      const transforms = [unwind({ paths: ['groups'] })]
      const json2csvParser = new Parser({ fields, transforms })
      const csv = json2csvParser.parse(searchResults)
      res.header('Content-Type', 'text/csv')
      res.attachment('lsa-report.csv')
      return res.send(csv)
    } catch (err) {
      await sendAudit(ManageUsersEvent.DOWNLOAD_REPORT_FAILURE)
      logger.error(err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      return res.end('An error occurred while generating the download')
    }
  }
  return { downloadLsaResults }
}

module.exports = {
  downloadFactory,
  downloadFactoryBetaSearch,
  downloadFactoryLsaSearch,
}
