const express = require('express')

const { viewBulkUserRolesRequestsFactory } = require('../controllers/viewBulkUserRolesRequests').default

const router = express.Router({ mergeParams: true })

const controller = () => {
  const { viewBulkUserRolesRequests, viewBulkUserRolesRequest, downloadBulkUserRolesRequestReport } =
    viewBulkUserRolesRequestsFactory()

  router.get('/requests', viewBulkUserRolesRequests)
  router.get('/requests/:id', viewBulkUserRolesRequest)
  router.get('/requests/:id/download', downloadBulkUserRolesRequestReport)
  return router
}

module.exports = () => controller()
