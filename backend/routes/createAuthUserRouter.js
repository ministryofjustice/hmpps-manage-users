const express = require('express')
const { createAuthUserFactory } = require('../controllers/createAuthUser')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi }) => {
  const getAssignableGroupsApi = oauthApi.assignableGroups

  const createAuthUserApi = (context, user) => oauthApi.createUser(context, user)

  const { index: createUser, post: postUser } = createAuthUserFactory(
    getAssignableGroupsApi,
    createAuthUserApi,
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
