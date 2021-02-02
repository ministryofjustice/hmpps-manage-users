const express = require('express')
const { selectGroupsFactory } = require('../controllers/getGroups')
const { groupDetailsFactory } = require('../controllers/groupDetails')
const { groupAmendmentFactory } = require('../controllers/groupNameAmendment')
const { createChildGroupFactory } = require('../controllers/createChildGroup')
const { childGroupAmendmentFactory } = require('../controllers/childGroupNameAmendment')
const { groupDeleteFactory } = require('../controllers/groupDelete')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi }) => {
  const getGroupDetailsApi = (context, group) => oauthApi.groupDetails(context, { group })
  const deleteGroupApi = (context, group) => oauthApi.deleteGroup(context, group)
  const getGroups = (context) => oauthApi.assignableGroups(context)
  const changeGroupNameApi = (context, group, groupName) => oauthApi.changeGroupName(context, group, { groupName })
  const getChildGroupDetailsApi = (context, group) => oauthApi.childGroupDetails(context, { group })
  const changeChildGroupNameApi = (context, group, groupName) =>
    oauthApi.changeChildGroupName(context, group, { groupName })
  const createChildGroupApi = (context, group) => oauthApi.createChildGroup(context, group)
  const deleteChildGroupApi = (context, group) => oauthApi.deleteChildGroup(context, group)

  const { index } = selectGroupsFactory(getGroups, '/manage-groups')

  const { index: getGroupAmendment, post: postGroupAmendment } = groupAmendmentFactory(
    getGroupDetailsApi,
    changeGroupNameApi,
    'Change group name',
    '/manage-groups',
  )
  const { index: getChildGroupAmendment, post: postChildGroupAmendment } = childGroupAmendmentFactory(
    getChildGroupDetailsApi,
    changeChildGroupNameApi,
    'Change child group name',
    '/manage-groups',
  )

  const { index: getGroupDetails, deleteChildGroup, getGroupDeleteWarn } = groupDetailsFactory(
    getGroupDetailsApi,
    deleteChildGroupApi,
    '/manage-groups',
  )

  const { index: getChildGroupCreate, post: postChildGroupCreate } = createChildGroupFactory(
    createChildGroupApi,
    '/manage-groups',
  )

  const { index: getGroupDelete, deleteGroup } = groupDeleteFactory(
    getGroupDetailsApi,
    deleteGroupApi,
    '/manage-groups',
  )

  router.get('/', index)
  router.get('/:group', getGroupDetails)
  router.get('/:group/change-group-name', getGroupAmendment)
  router.post('/:group/change-group-name', postGroupAmendment)
  router.get('/:pgroup/create-child-group', getChildGroupCreate)
  router.post('/:pgroup/create-child-group', postChildGroupCreate)
  router.get('/:pgroup/change-child-group-name/:group', getChildGroupAmendment)
  router.post('/:pgroup/change-child-group-name/:group', postChildGroupAmendment)
  router.get('/:pgroup/delete-child-group/:group', deleteChildGroup)
  router.get('/:group/delete/children/some', getGroupDeleteWarn)
  router.get('/:group/delete/children/none', getGroupDelete)
  router.get('/:group/delete', deleteGroup)
  return router
}

module.exports = (dependencies) => controller(dependencies)
