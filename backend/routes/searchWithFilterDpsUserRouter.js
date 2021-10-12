const express = require('express')
const json2csv = require('json2csv')
const { searchFactory } = require('../controllers/searchWithFilter')
const paginationService = require('../services/paginationService')
const { downloadFactory } = require('../controllers/searchDownload')
const { allowDownload } = require('../services/downloadService')
const searchApiFactory = require('./searchApiFactory')

const router = express.Router({ mergeParams: true })

const controller = ({ prisonApi, oauthApi, nomisUsersAndRolesApi }) => {
  const { findUsersApi, searchApi, searchableRoles, caseloads } = searchApiFactory(
    prisonApi,
    oauthApi,
    nomisUsersAndRolesApi,
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

  const { downloadResults } = downloadFactory(searchApi, json2csv.parse, allowDownload)

  router.get('/', search)
  router.get('/download', downloadResults)
  return router
}

module.exports = (dependencies) => controller(dependencies)
