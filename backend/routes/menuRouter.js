const express = require('express')
const { menuFactory } = require('../controllers/menu')

const router = express.Router()

const controller = ({ prisonApi, logError }) => {
  const { index } = menuFactory(prisonApi, logError)

  router.get('/', index)
  return router
}

module.exports = (dependencies) => controller(dependencies)
