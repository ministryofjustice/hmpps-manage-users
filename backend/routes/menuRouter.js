const express = require('express')
const { menuFactory } = require('../controllers/menu')

const router = express.Router()

const controller = ({ logError }) => {
  const { index } = menuFactory(logError)

  router.get('/', index)
  return router
}

module.exports = (dependencies) => controller(dependencies)
