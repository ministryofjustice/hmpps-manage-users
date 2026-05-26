const express = require('express')
const { bulkUserRolesRequestsFactory } = require('../controllers/bulkUserRolesRequests').default
const searchApiFactory = require('./searchApiFactory')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const { searchableRoles } = searchApiFactory(manageUsersApi)
  const {
    getCreateNew,
    postReference,
    getSelectRoles,
    postSelectRoles,
    getUserCsvUpload,
    postUserCsvUpload,
    viewBulkUserRolesRequests,
    viewBulkUserRolesRequest,
  } = bulkUserRolesRequestsFactory(searchableRoles)

  router.get('/', getCreateNew)
  router.post('/reference', postReference)
  router.get('/select-roles', getSelectRoles)
  router.post('/select-roles', postSelectRoles)
  router.get('/upload-users', getUserCsvUpload)
  router.post('/upload-users', postUserCsvUpload)

  router.get('/requests', viewBulkUserRolesRequests)
  router.get('/requests/:id', viewBulkUserRolesRequest)

  return router
}

module.exports = (dependencies) => controller(dependencies)
