const express = require('express')
const { selectGroupsFactory } = require('../controllers/getGroups')
const { groupDetailsFactory } = require('../controllers/groupDetails')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const getGroupDetailsApi = (context, group) => oauthApi.groupDetails(context, { group })
  const getGroups = (context) => oauthApi.assignableGroups(context)

  const { index } = selectGroupsFactory(getGroups, '/manage-groups', logError)

  const { index: getGroupDetails } = groupDetailsFactory(getGroupDetailsApi, '/manage-groups', logError)

  router.get('/', index)
  router.get('/:group', getGroupDetails)
  return router
}

module.exports = (dependencies) => controller(dependencies)
