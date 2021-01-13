const express = require('express')
const { createUserFactory } = require('../controllers/createUser')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi }) => {
  const getAssignableGroupsApi = oauthApi.assignableGroups

  const createUserApi = (context, user) => oauthApi.createUser(context, user)

  const { index: createUser, post: postUser } = createUserFactory(
    getAssignableGroupsApi,
    createUserApi,
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
