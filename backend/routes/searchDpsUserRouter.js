const express = require('express')
const { searchFactory } = require('../controllers/search')
const paginationService = require('../services/offsetPaginationService')
const contextProperties = require('../contextProperties')

const router = express.Router({ mergeParams: true })

const controller = ({ prisonApi, oauthApi }) => {
  const searchApi = async ({
    locals: context,
    user: nameFilter,
    roleCode,
    status,
    pageSize: size,
    pageOffset: offset,
  }) => {
    const hasAdminRole = Boolean(context && context.user && context.user.maintainAccessAdmin)

    contextProperties.setRequestPagination(context, { offset, size })
    const searchResults = await (hasAdminRole
      ? prisonApi.userSearchAdmin(context, { nameFilter, roleFilter: roleCode, status })
      : prisonApi.userSearch(context, { nameFilter, roleFilter: roleCode, status }))

    if (searchResults.length === 0) return searchResults

    // now augment with auth email addresses
    const emails = await oauthApi.userEmails(
      context,
      searchResults.map((user) => user.username),
    )
    const emailMap = new Map(emails.map((obj) => [obj.username, obj.email]))

    return searchResults.map((user) => ({ ...user, email: emailMap.get(user.username) }))
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
    'Search for a DPS user',
  )

  router.get('/', index)
  router.get('/results', results)
  router.post('/results', results)
  return router
}

module.exports = (dependencies) => controller(dependencies)
