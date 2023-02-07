const express = require('express')
const { viewEmailDomainsFactory } = require('../controllers/getAllEmailDomains')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const getAllEmailDomainsApi = manageUsersApi.getAllEmailDomains

  const { index: listAllDomains } = viewEmailDomainsFactory(getAllEmailDomainsApi)

  router.get('/', listAllDomains)

  return router
}

module.exports = (dependencies) => controller(dependencies)
