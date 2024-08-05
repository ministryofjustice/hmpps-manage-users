const express = require('express')
const { searchFactory } = require('../controllers/searchDpsUsers')
const paginationService = require('../services/paginationService').default
const { downloadFactoryBetaSearch, downloadFactoryLsaSearch } = require('../controllers/searchDownload')
const { allowDownload } = require('../services/downloadService')
const searchApiFactory = require('./searchApiFactory')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const { findUsersApi, searchableRoles, caseloads, downloadNomisUserDetails, downloadNomisLsaDetails } =
    searchApiFactory(manageUsersApi)

  const search = searchFactory(
    paginationService,
    caseloads,
    searchableRoles,
    findUsersApi,
    '/search-with-filter-dps-users',
    '/manage-dps-users',
    'Search for a DPS user',
    allowDownload,
  )
  const { downloadBetaResults } = downloadFactoryBetaSearch(downloadNomisUserDetails, allowDownload)
  const { downloadLsaResults } = downloadFactoryLsaSearch(downloadNomisLsaDetails, allowDownload)

  router.get('/', search)
  router.get('/user-download', downloadBetaResults)
  router.get('/lsa-download', downloadLsaResults)
  return router
}

module.exports = (dependencies) => controller(dependencies)
