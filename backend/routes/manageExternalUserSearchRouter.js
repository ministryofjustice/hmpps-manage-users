const express = require('express')
const { externalSearchFactory } = require('../controllers/externalSearch')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const searchApi = (context, nameFilter) => oauthApi.userSearch(context, { nameFilter })

  const { results } = externalSearchFactory(
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
