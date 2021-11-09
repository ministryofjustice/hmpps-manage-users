const express = require('express')
const json2csv = require('json2csv')
const { searchFactory } = require('../controllers/search')
const paginationService = require('../services/offsetPaginationService')
const contextProperties = require('../contextProperties')
const { downloadFactory } = require('../controllers/searchDownload')
const { allowDownload } = require('../services/downloadService')
const searchApiFactory = require('./searchApiFactory')

const router = express.Router({ mergeParams: true })

const controller = ({ prisonApi, oauthApi, nomisUsersAndRolesApi, manageUsersApi }) => {
  const { searchApi, searchableRoles, prisons } = searchApiFactory(
    prisonApi,
    oauthApi,
    nomisUsersAndRolesApi,
    manageUsersApi,
  )

  const { index, results } = searchFactory(
    paginationService,
    prisons,
    searchableRoles,
    searchApi,
    contextProperties.getResponsePagination,
    '/search-dps-users',
    '/manage-dps-users',
    'Search for a DPS user',
    true,
    allowDownload,
  )

  const { downloadResults } = downloadFactory(searchApi, json2csv.parse, allowDownload)

  router.get('/', index)
  router.get('/results', results)
  router.post('/results', results)
  router.get('/download', downloadResults)
  return router
}

module.exports = (dependencies) => controller(dependencies)
