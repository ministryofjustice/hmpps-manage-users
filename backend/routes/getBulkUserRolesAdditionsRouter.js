const express = require('express')

const { getBulkUserRolesRequestsFactory } = require('../controllers/getBulkUserRolesAdditions')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const { getAllBulkUserRolesAdditions, getBulkUserRoleAdditionsDetails } = manageUsersApi
  const bulkUserRolesAdditionsApi = {
    getAll: getAllBulkUserRolesAdditions,
    getById: getBulkUserRoleAdditionsDetails,
  }
  const { getBulkUserRolesAdditions, getBulkUserRolesAdditionDetails } =
    getBulkUserRolesRequestsFactory(bulkUserRolesAdditionsApi)

  router.get('/requests', getBulkUserRolesAdditions)
  router.get('/requests/:id', getBulkUserRolesAdditionDetails)
  return router
}

module.exports = (dependencies) => controller(dependencies)
