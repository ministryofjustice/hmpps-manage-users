const express = require('express')
const { selectGroupsFactory } = require('../controllers/getGroups')
const { groupDetailsFactory } = require('../controllers/groupDetails')
const { groupAmendmentFactory } = require('../controllers/groupNameAmendment')
const { childGroupAmendmentFactory } = require('../controllers/childGroupNameAmendment')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const getGroupDetailsApi = (context, group) => oauthApi.groupDetails(context, { group })
  const getGroups = (context) => oauthApi.assignableGroups(context)
  const changeGroupNameApi = (context, group, groupName) => oauthApi.changeGroupName(context, group, { groupName })
  const getChildGroupDetailsApi = (context, group) => oauthApi.childGroupDetails(context, { group })
  const changeChildGroupNameApi = (context, group, groupName) =>
    oauthApi.changeChildGroupName(context, group, { groupName })

  const { index } = selectGroupsFactory(getGroups, '/manage-groups', logError)

  const { index: getGroupAmendment, post: postGroupAmendment } = groupAmendmentFactory(
    getGroupDetailsApi,
    changeGroupNameApi,
    'Change group name',
    '/manage-groups',
    logError
  )
  const { index: getChildGroupAmendment, post: postChildGroupAmendment } = childGroupAmendmentFactory(
    getChildGroupDetailsApi,
    changeChildGroupNameApi,
    'Change child group name',
    '/manage-groups',
    logError
  )

  const { index: getGroupDetails } = groupDetailsFactory(getGroupDetailsApi, '/manage-groups', logError)

  router.get('/', index)
  router.get('/:group', getGroupDetails)
  router.get('/:group/change-group-name', getGroupAmendment)
  router.post('/:group/change-group-name', postGroupAmendment)
  router.get('/:pgroup/change-child-group-name/:group', getChildGroupAmendment)
  router.post('/:pgroup/change-child-group-name/:group', postChildGroupAmendment)
  return router
}

module.exports = (dependencies) => controller(dependencies)
