const express = require('express')
const { viewRolesFactory } = require('../controllers/getAllRoles')
const { roleDetailsFactory } = require('../controllers/roleDetails')
const paginationService = require('../services/paginationService')
const contextProperties = require('../contextProperties')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi }) => {
  const getAllRolesApi = (context, page, size) => oauthApi.getAllRoles(context, page, size)
  const getRoleDetailsApi = (context, roleCode) => oauthApi.getRoleDetails(context, roleCode)

  const { index } = viewRolesFactory(paginationService, contextProperties.getPageable, getAllRolesApi, '/manage-roles')

  const { index: roleDetails } = roleDetailsFactory(getRoleDetailsApi, '/manage-roles')

  router.get('/', index)
  router.get('/:roleCode', roleDetails)
  return router
}

module.exports = (dependencies) => controller(dependencies)
