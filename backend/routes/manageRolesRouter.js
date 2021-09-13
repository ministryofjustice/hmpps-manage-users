const express = require('express')
const { viewRolesFactory } = require('../controllers/getAllRoles')
const { roleDetailsFactory } = require('../controllers/roleDetails')
const { roleNameAmendmentFactory } = require('../controllers/roleNameAmendment')
const { roleDescriptionAmendmentFactory } = require('../controllers/roleDescriptionAmendment')
const paginationService = require('../services/paginationService')
const contextProperties = require('../contextProperties')
const { createRoleFactory } = require('../controllers/createRole')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi }) => {
  const getAllRolesApi = (context, page, size) => oauthApi.getAllRoles(context, page, size)
  const getRoleDetailsApi = (context, roleCode) => oauthApi.getRoleDetails(context, roleCode)
  const changeRoleNameApi = (context, role, roleName) => oauthApi.changeRoleName(context, role, { roleName })
  const changeRoleDescriptionApi = (context, role, roleDescription) =>
    oauthApi.changeRoleDescription(context, role, { roleDescription })
  const createRoleApi = (context, role) => oauthApi.createRole(context, role)

  const { index } = viewRolesFactory(paginationService, contextProperties.getPageable, getAllRolesApi, '/manage-roles')

  const { index: roleDetails } = roleDetailsFactory(getRoleDetailsApi, '/manage-roles')
  const { index: getRoleNameAmendment, post: postRoleNameAmendment } = roleNameAmendmentFactory(
    getRoleDetailsApi,
    changeRoleNameApi,
    'Change role name',
    '/manage-roles',
  )
  const { index: getRoleDescriptionAmendment, post: postRoleDescriptionAmendment } = roleDescriptionAmendmentFactory(
    getRoleDetailsApi,
    changeRoleDescriptionApi,
    'Change role description',
    '/manage-roles',
  )

  const { index: getRoleCreate, post: postRoleCreate } = createRoleFactory(createRoleApi, '/manage-roles')

  router.get('/', index)
  router.get('/create-role', getRoleCreate)
  router.post('/create-role', postRoleCreate)
  router.get('/:roleCode', roleDetails)
  router.get('/:role/change-role-name', getRoleNameAmendment)
  router.post('/:role/change-role-name', postRoleNameAmendment)
  router.get('/:role/change-role-description', getRoleDescriptionAmendment)
  router.post('/:role/change-role-description', postRoleDescriptionAmendment)
  return router
}

module.exports = (dependencies) => controller(dependencies)
