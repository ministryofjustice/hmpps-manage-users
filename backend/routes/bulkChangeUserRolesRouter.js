const express = require('express')
const multer = require('multer')
const searchApiFactory = require('./searchApiFactory')
const { createBulkUserRolesRequestsFactory } = require('../controllers/createBulkUserRolesRequests')

const router = express.Router({ mergeParams: true })
const upload = multer({ dest: 'uploads/' })

const controller = ({ manageUsersApi, csrfProtection }) => {
  const { searchableRoles } = searchApiFactory(manageUsersApi)
  const { getCreateNew, postJiraReference, getSelectRoles, postSelectRoles, getUsersCsvUpload } =
    createBulkUserRolesRequestsFactory(searchableRoles)

  router.get('/', getCreateNew)
  router.post('/jira-reference', postJiraReference)
  router.get('/select-roles', getSelectRoles)
  router.post('/select-roles', postSelectRoles)
  router.get('/upload-users', getUsersCsvUpload)
  return router
}

module.exports = (dependencies) => controller(dependencies)
