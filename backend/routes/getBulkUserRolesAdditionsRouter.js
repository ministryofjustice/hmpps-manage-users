const express = require('express')

const { getBulkUserRolesRequestsFactory } = require('../controllers/getBulkUserRolesAdditions')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const { getAllBulkUserRolesAdditions, getBulkUserRoleAdditionsById } = manageUsersApi
  const bulkUserRolesAdditionsApi = {
    getAll: getAllBulkUserRolesAdditions,
    getById: getBulkUserRoleAdditionsById,
  }
  const { getBulkUserRolesAdditions } = getBulkUserRolesRequestsFactory(bulkUserRolesAdditionsApi)

  router.get('/requests', getBulkUserRolesAdditions)
  return router
}

module.exports = (dependencies) => controller(dependencies)
