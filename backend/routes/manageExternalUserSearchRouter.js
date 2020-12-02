const express = require('express')
const { externalSearchFactory } = require('../controllers/externalSearch')
const paginationService = require('../services/paginationService')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const searchApi = (context, nameFilter, page, size) => oauthApi.userSearch(context, { nameFilter }, page, size)

  const { results } = externalSearchFactory(
    paginationService,
    searchApi,
    '/maintain-external-users',
    '/manage-external-users',
    'Maintain external users',
    logError
  )

  router.get('/results', results)
  router.post('/results', results)
  return router
}

module.exports = (dependencies) => controller(dependencies)
