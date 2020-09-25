const express = require('express')
const { addRoleFactory } = require('../controllers/addRole')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, prisonApi, logError }) => {
  const { index, post } = addRoleFactory(oauthApi, prisonApi, logError)

  router.get('/', index)
  router.post('/', post)
  return router
}

module.exports = (dependencies) => controller(dependencies)
