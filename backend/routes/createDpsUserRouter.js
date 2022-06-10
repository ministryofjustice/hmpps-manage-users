const express = require('express')
const { createDpsUserFactory } = require('../controllers/createDpsUser')

const router = express.Router({ mergeParams: true })

const controller = ({ nomisUsersAndRolesApi }) => {
  const getAllCaseloads = nomisUsersAndRolesApi.getCaseloads

  const createDpsAdminUserApi = (context, user) => nomisUsersAndRolesApi.createAdminUser(context, user)
  const createDpsGeneralUserApi = (context, user) => nomisUsersAndRolesApi.createGeneralUser(context, user)
  const createDpsLocalAdminUserApi = (context, user) => nomisUsersAndRolesApi.createLocalAdminUser(context, user)

  const { index: createDpsUser, post: postDpsUser } = createDpsUserFactory(
    getAllCaseloads,
    createDpsAdminUserApi,
    createDpsGeneralUserApi,
    createDpsLocalAdminUserApi,
    '/create-user',
    '/manage-dps-users',
  )

  router.get('/', createDpsUser)
  router.post('/', postDpsUser)
  return router
}

module.exports = (dependencies) => controller(dependencies)
