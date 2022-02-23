const express = require('express')
const { menuFactory } = require('../controllers/menu')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const getMessage = (context) => manageUsersApi.getNotificationBannerMessage(context, 'DPSMENU')

  const { index } = menuFactory(getMessage)

  router.get('/', index)
  return router
}

module.exports = (dependencies) => controller(dependencies)
