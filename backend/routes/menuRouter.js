const express = require('express')
const { menuFactory } = require('../controllers/menu')

const router = express.Router()

const controller = () => {
  const { index } = menuFactory()

  router.get('/', index)
  return router
}

module.exports = () => controller()
