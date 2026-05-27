const express = require('express')
const multer = require('multer')
const { bulkUserRolesRequestsFactory } = require('../controllers/bulkUserRolesRequests').default
const searchApiFactory = require('./searchApiFactory')

const router = express.Router({ mergeParams: true })
const upload = multer({ dest: 'uploads/' })

const controller = ({ manageUsersApi, csrfProtection }) => {
  const { searchableRoles } = searchApiFactory(manageUsersApi)
  const {
    getCreateNew,
    postReference,
    getSelectRoles,
    postSelectRoles,
    getUserCsvUpload,
    postUserCsvUpload,
    getBulkRequestSummary,
    postBulkRequestSubmit,
    viewBulkUserRolesRequests,
    viewBulkUserRolesRequest,
  } = bulkUserRolesRequestsFactory(searchableRoles)

  router.get('/', getCreateNew)
  router.post('/reference', postReference)
  router.get('/select-roles', getSelectRoles)
  router.post('/select-roles', postSelectRoles)
  router.get('/upload-users', getUserCsvUpload)
  router.post('/upload-users', upload.single('file'), csrfProtection, postUserCsvUpload)
  router.get('/summary', getBulkRequestSummary)
  router.post('/submit', postBulkRequestSubmit)

  router.get('/requests', viewBulkUserRolesRequests)
  router.get('/requests/:id', viewBulkUserRolesRequest)

  return router
}

module.exports = (dependencies) => controller(dependencies)
