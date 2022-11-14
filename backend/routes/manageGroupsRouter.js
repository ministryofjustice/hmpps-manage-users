const express = require('express')
const { selectGroupsFactory } = require('../controllers/getGroups')
const { groupDetailsFactory } = require('../controllers/groupDetails')
const { groupAmendmentFactory } = require('../controllers/groupNameAmendment')
const { createChildGroupFactory } = require('../controllers/createChildGroup')
const { createGroupFactory } = require('../controllers/createGroup')
const { childGroupAmendmentFactory } = require('../controllers/childGroupNameAmendment')
const { groupDeleteFactory } = require('../controllers/groupDelete')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, manageUsersApi }) => {
  const getGroupDetailsApi = (context, group) => manageUsersApi.groupDetails(context, { group })

  const deleteGroupApi = (context, group) => manageUsersApi.deleteGroup(context, group)
  const getAssignableGroups = (context) => oauthApi.assignableGroups(context)
  const changeGroupNameApi = (context, group, groupName) =>
    manageUsersApi.changeGroupName(context, group, { groupName })
  const getChildGroupDetailsApi = (context, group) => manageUsersApi.childGroupDetails(context, { group })
  const changeChildGroupNameApi = (context, group, groupName) =>
    manageUsersApi.changeChildGroupName(context, group, { groupName })
  const createChildGroupApi = (context, group) => manageUsersApi.createChildGroup(context, group)
  const createGroupApi = (context, group) => manageUsersApi.createGroup(context, group)
  const deleteChildGroupApi = (context, group) => manageUsersApi.deleteChildGroup(context, group)

  const { index, search } = selectGroupsFactory(getAssignableGroups, '/manage-groups')

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

  const {
    index: getGroupDetails,
    deleteChildGroup,
    getGroupDeleteWarn,
  } = groupDetailsFactory(getGroupDetailsApi, deleteChildGroupApi, '/manage-groups')

  const { index: getChildGroupCreate, post: postChildGroupCreate } = createChildGroupFactory(
    createChildGroupApi,
    '/manage-groups',
  )

  const { index: getGroupCreate, post: postGroupCreate } = createGroupFactory(createGroupApi, '/manage-groups')

  const { index: getGroupDelete, deleteGroup } = groupDeleteFactory(
    getGroupDetailsApi,
    deleteGroupApi,
    '/manage-groups',
  )

  router.get('/', index)
  router.post('/', search)
  router.get('/create-group', getGroupCreate)
  router.post('/create-group', postGroupCreate)
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
