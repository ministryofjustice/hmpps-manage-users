const express = require('express')
const { createUserFactory } = require('../controllers/createUser')

const router = express.Router({ mergeParams: true })

const controller = ({ oauthApi, logError }) => {
  const getAssignableGroupsApi = oauthApi.assignableGroups

  const createUserApi = (context, user) => oauthApi.createUser(context, user.username, user)

  const { index: createUser, post: postUser } = createUserFactory(
    getAssignableGroupsApi,
    createUserApi,
    '/create-external-users',
    '/manage-external-users',
    'Search for an external user',
    logError
  )

  router.get('/', createUser)
  router.post('/', postUser)
  return router
}

module.exports = (dependencies) => controller(dependencies)
