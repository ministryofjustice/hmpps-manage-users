const express = require('express')
const { viewRolesFactory } = require('../controllers/getAllRoles')
const paginationService = require('../services/paginationService')
const contextProperties = require('../contextProperties')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi }) => {
  const getAllRoles = (context, page, size) => oauthApi.getAllRoles(context, page, size)

  const { index } = viewRolesFactory(paginationService, contextProperties.getPageable, getAllRoles, '/manage-roles')

  router.get('/', index)
  return router
}

module.exports = (dependencies) => controller(dependencies)
