const express = require('express')
const { searchFactory } = require('../controllers/search')
const paginationService = require('../services/offsetPaginationService')
const contextProperties = require('../contextProperties')

const router = express.Router({ mergeParams: true })

const controller = ({ prisonApi, logError }) => {
  const searchApi = (context, nameFilter, groupCode, roleCode, page, size, offset) => {
    const hasAdminRole = Boolean(context && context.user && context.user.maintainAccessAdmin)

    contextProperties.setRequestPagination(context, { offset, size })
    return hasAdminRole
      ? prisonApi.userSearchAdmin(context, { nameFilter, roleFilter: roleCode })
      : prisonApi.userSearch(context, { nameFilter, roleFilter: roleCode })
  }

  const searchableRoles = (context) => {
    const hasAdminRole = Boolean(context && context.user && context.user.maintainAccessAdmin)
    return hasAdminRole ? prisonApi.getRolesAdmin(context) : prisonApi.getRoles(context)
  }

  const { index, results } = searchFactory(
    paginationService,
    undefined,
    searchableRoles,
    searchApi,
    contextProperties.getResponsePagination,
    '/search-dps-users',
    '/manage-dps-users',
    'Search DPS users',
    logError
  )

  router.get('/', index)
  router.get('/results', results)
  router.post('/results', results)
  return router
}

module.exports = (dependencies) => controller(dependencies)
