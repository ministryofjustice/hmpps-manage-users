const express = require('express')
const json2csv = require('json2csv')
const { searchFactory } = require('../controllers/searchExternalUsers')
const paginationService = require('../services/paginationService').default
const contextProperties = require('../contextProperties')
const { downloadFactory } = require('../controllers/searchDownload')
const { allowDownload } = require('../services/downloadService')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const searchApi = ({ locals: context, user: nameFilter, groupCode, roleCode, status, page, size }) =>
    manageUsersApi.userSearch(context, { nameFilter, group: groupCode, role: roleCode, status }, page, size)

  const assignableGroups = async (context) =>
    (await manageUsersApi.assignableGroups(context)).map((g) => ({
      text: g.groupName,
      value: g.groupCode,
    }))

  const search = searchFactory(
    paginationService,
    assignableGroups,
    manageUsersApi.searchableRoles,
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
