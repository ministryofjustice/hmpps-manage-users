const express = require('express')
const { selectGroupsFactory } = require('../controllers/getGroups')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const getGroups = (context) => oauthApi.assignableGroups(context)

  const { index } = selectGroupsFactory(getGroups, logError)

  router.get('/', index)
  return router
}

module.exports = (dependencies) => controller(dependencies)
