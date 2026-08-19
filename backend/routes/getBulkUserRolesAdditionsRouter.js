const express = require('express')
const { audit, ManageUsersEvent } = require('../audit')
const paginationService = require('../services/paginationService').default
const contextProperties = require('../contextProperties')

const { getBulkUserRolesRequestsFactory } = require('../controllers/getBulkUserRolesAdditions')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const { getAllBulkUserRolesAdditions, getBulkUserRoleAdditionsDetails, getBulkUserAdditionsCsvDownload } =
    manageUsersApi

  const bulkUserRolesAdditionsApi = {
    getAll: getAllBulkUserRolesAdditions,
    getById: getBulkUserRoleAdditionsDetails,
    getDownloadCsvStream: getBulkUserAdditionsCsvDownload,
  }

  const { getBulkUserRolesAdditions, getBulkUserRolesAdditionDetails, getResultsCsvDownload } =
    getBulkUserRolesRequestsFactory(
      bulkUserRolesAdditionsApi,
      paginationService,
      contextProperties.getPageable,
      { audit },
      ManageUsersEvent,
    )

  router.get('/requests', getBulkUserRolesAdditions)
  router.get('/requests/:id', getBulkUserRolesAdditionDetails)
  router.get('/requests/:id/download', getResultsCsvDownload)
  return router
}

module.exports = (dependencies) => controller(dependencies)
