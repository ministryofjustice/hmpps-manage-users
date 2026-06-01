const express = require('express')
const multer = require('multer')
const searchApiFactory = require('./searchApiFactory')
const { createBulkUserRolesRequestsFactory } = require('../controllers/createBulkUserRolesRequests')

const router = express.Router({ mergeParams: true })
const upload = multer({ dest: 'uploads/' })

const controller = ({ manageUsersApi, csrfProtection }) => {
  const { searchableRoles } = searchApiFactory(manageUsersApi)
  const { getCreateNew } = createBulkUserRolesRequestsFactory(searchableRoles)

  router.get('/', getCreateNew)
  return router
}

module.exports = (dependencies) => controller(dependencies)
