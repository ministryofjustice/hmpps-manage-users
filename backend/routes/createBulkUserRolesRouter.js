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
    postJiraReference,
    getSelectRoles,
    postSelectRoles,
    getUserCsvUpload,
    postUserCsvUpload,
    getBulkRequestSummary,
    postBulkRequestSubmit,
  } = createBulkUserRolesRequestsFactory(searchableRoles)

  router.get('/', getCreateNew)
  router.post('/jira-reference', postJiraReference)
  router.get('/select-roles', getSelectRoles)
  router.post('/select-roles', postSelectRoles)
  router.get('/upload-users', getUserCsvUpload)
  router.post('/upload-users', upload.single('file'), csrfProtection, postUserCsvUpload)
  router.get('/summary', getBulkRequestSummary)
  router.post('/submit', postBulkRequestSubmit)
  return router
}

module.exports = (dependencies) => controller(dependencies)
