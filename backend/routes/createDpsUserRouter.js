const express = require('express')
const { createDpsUserFactory } = require('../controllers/createDpsUser')

const router = express.Router({ mergeParams: true })

const controller = ({ nomisUsersAndRolesApi, manageUsersApi }) => {
  const getAllCaseloads = nomisUsersAndRolesApi.getCaseloads
  const createUser = (context, user) => manageUsersApi.createUser(context, user)

  const { index: createDpsUser, post: postDpsUser } = createDpsUserFactory(
    getAllCaseloads,
    createUser,
    '/create-user',
    '/manage-dps-users',
  )

  router.get('/', createDpsUser)
  router.post('/', postDpsUser)
  return router
}

module.exports = (dependencies) => controller(dependencies)
