const express = require('express')
const multer = require('multer')
const os = require('os')
const searchApiFactory = require('./searchApiFactory')
const { createBulkUserRolesRequestsFactory } = require('../controllers/createBulkUserRolesRequests')

const router = express.Router({ mergeParams: true })
const storage = multer.memoryStorage()
const upload = multer({
  dest: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
})

const controller = ({ manageUsersApi, csrfProtection }) => {
  const { searchableRoles } = searchApiFactory(manageUsersApi)
  const { bulkUserRolesAdditions } = manageUsersApi
  const {
    getCreateNew,
    postJiraReference,
    getSelectRoles,
    postSelectRoles,
    getUsersCsvUpload,
    postUserCsvUpload,
    getBulkRequestSummary,
    postSubmitBulkUserRolesRequest,
  } = createBulkUserRolesRequestsFactory(searchableRoles, bulkUserRolesAdditions)

  router.get('/', getCreateNew)
  router.post('/jira-reference', postJiraReference)
  router.get('/select-roles', getSelectRoles)
  router.post('/select-roles', postSelectRoles)
  router.get('/upload-users', getUsersCsvUpload)
  router.post('/upload-users', upload.single('file'), csrfProtection, postUserCsvUpload)
  router.get('/summary', getBulkRequestSummary)
  router.post('/submit', postSubmitBulkUserRolesRequest)
  return router
}

module.exports = (dependencies) => controller(dependencies)
