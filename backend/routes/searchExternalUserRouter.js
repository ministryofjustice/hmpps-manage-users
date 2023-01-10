const express = require('express')
const json2csv = require('json2csv')
const { searchFactory } = require('../controllers/searchExternalUsers')
const paginationService = require('../services/paginationService')
const contextProperties = require('../contextProperties')
const { downloadFactory } = require('../controllers/searchDownload')
const { allowDownload } = require('../services/downloadService')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi }) => {
  const searchApi = ({ locals: context, user: nameFilter, groupCode, roleCode, status, page, size }) =>
    oauthApi.userSearch(context, { nameFilter, group: groupCode, role: roleCode, status }, page, size)

  const assignableGroups = async (context) =>
    (await oauthApi.assignableGroups(context)).map((g) => ({
      text: g.groupName,
      value: g.groupCode,
    }))

  const search = searchFactory(
    paginationService,
    assignableGroups,
    oauthApi.searchableRoles,
    searchApi,
    contextProperties.getPageable,
    '/search-external-users',
    '/manage-external-users',
    'Search for an external user',
    allowDownload,
  )

  const { downloadResults } = downloadFactory(searchApi, json2csv.parse, allowDownload)

  router.get('/', search)
  router.get('/download', downloadResults)
  return router
}

module.exports = (dependencies) => controller(dependencies)
