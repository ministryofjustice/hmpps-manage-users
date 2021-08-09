const express = require('express')
const json2csv = require('json2csv')
const { searchFactory } = require('../controllers/search')
const paginationService = require('../services/offsetPaginationService')
const contextProperties = require('../contextProperties')
const { downloadFactory } = require('../controllers/searchDownload')
const { allowDownload } = require('../services/downloadService')

const router = express.Router({ mergeParams: true })

const controller = ({ prisonApi, oauthApi }) => {
  const searchApi = async ({
    locals: context,
    user: nameFilter,
    roleCode,
    status,
    groupCode,
    activeCaseload,
    pageSize: size,
    pageOffset: offset,
  }) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)

    contextProperties.setRequestPagination(context, { offset, size })
    const searchResults = await (hasAdminRole
      ? prisonApi.userSearchAdmin(context, {
          nameFilter,
          roleFilter: roleCode,
          status,
          caseload: groupCode,
          activeCaseload,
        })
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
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    return hasAdminRole ? prisonApi.getRolesAdmin(context) : prisonApi.getRoles(context)
  }

  const caseloads = async (context) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    if (!hasAdminRole) return []
    return (await prisonApi.getCaseloads(context))
      .map((g) => ({
        text: g.description,
        value: g.agencyId,
      }))
      .sort((a, b) => a.text?.localeCompare(b.text))
  }

  const { index, results } = searchFactory(
    paginationService,
    caseloads,
    searchableRoles,
    searchApi,
    contextProperties.getResponsePagination,
    '/search-dps-users',
    '/manage-dps-users',
    'Search for a DPS user',
    true,
    allowDownload,
  )

  const { downloadResults } = downloadFactory(searchApi, json2csv.parse, allowDownload)

  router.get('/', index)
  router.get('/results', results)
  router.post('/results', results)
  router.get('/download', downloadResults)
  return router
}

module.exports = (dependencies) => controller(dependencies)
