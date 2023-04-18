const express = require('express')
const { createExternalUserFactory } = require('../controllers/createExternalUser')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const getAssignableGroupsApi = manageUsersApi.assignableGroups

  const createExternalUserApi = (context, user) => manageUsersApi.createExternalUser(context, user)

  const { index: createUser, post: postUser } = createExternalUserFactory(
    getAssignableGroupsApi,
    createExternalUserApi,
    '/create-external-users',
    '/search-external-users',
    '/manage-external-users',
    'Search for an external user',
  )

  router.get('/', createUser)
  router.post('/', postUser)
  return router
}

module.exports = (dependencies) => controller(dependencies)
