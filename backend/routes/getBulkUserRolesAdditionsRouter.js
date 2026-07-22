const express = require('express')

const { getBulkUserRolesRequestsFactory } = require('../controllers/getBulkUserRolesAdditions')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const { getBulkUserRolesAdditions } = manageUsersApi
  const { getBulkUserRolesRequests } = getBulkUserRolesRequestsFactory(getBulkUserRolesAdditions)

  router.get('/requests', getBulkUserRolesRequests)
  return router
}

module.exports = (dependencies) => controller(dependencies)
