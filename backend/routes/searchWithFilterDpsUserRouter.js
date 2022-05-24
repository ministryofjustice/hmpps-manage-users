const express = require('express')
const { searchFactory } = require('../controllers/searchWithFilter')
const paginationService = require('../services/paginationService')
const { downloadFactoryBetaSearch } = require('../controllers/searchDownload')
const { allowDownload } = require('../services/downloadService')
const searchApiFactory = require('./searchApiFactory')

const router = express.Router({ mergeParams: true })

const controller = ({ prisonApi, oauthApi, nomisUsersAndRolesApi, manageUsersApi }) => {
  const { findUsersApi, searchableRoles, caseloads } = searchApiFactory(
    prisonApi,
    oauthApi,
    nomisUsersAndRolesApi,
    manageUsersApi,
  )

  const search = searchFactory(
    paginationService,
    caseloads,
    searchableRoles,
    findUsersApi,
    '/search-with-filter-dps-users',
    '/manage-dps-users',
    'Search for a DPS user (BETA)',
    true,
    allowDownload,
  )
  const { downloadBetaResults } = downloadFactoryBetaSearch(findUsersApi, allowDownload)

  router.get('/', search)
  router.get('/download', downloadBetaResults)
  return router
}

module.exports = (dependencies) => controller(dependencies)
