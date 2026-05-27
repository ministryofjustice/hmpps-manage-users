const express = require('express')
const multer = require('multer')
const { createBulkUserRolesRequestsFactory } = require('../controllers/createBulkUserRolesRequests').default
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
  } = createBulkUserRolesRequestsFactory(searchableRoles)

  router.get('/', getCreateNew)
  router.post('/reference', postReference)
  router.get('/select-roles', getSelectRoles)
  router.post('/select-roles', postSelectRoles)
  router.get('/upload-users', getUserCsvUpload)
  router.post('/upload-users', upload.single('file'), csrfProtection, postUserCsvUpload)
  router.get('/summary', getBulkRequestSummary)
  router.post('/submit', postBulkRequestSubmit)
  return router
}

module.exports = (dependencies) => controller(dependencies)
