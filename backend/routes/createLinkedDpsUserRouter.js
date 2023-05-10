const express = require('express')
const { createLinkedDpsUserFactory } = require('../controllers/createLinkedDpsUser')

const router = express.Router({ mergeParams: true })

const controller = ({ nomisUsersAndRolesApi, manageUsersApi }) => {
  const getAllCaseloads = nomisUsersAndRolesApi.getCaseloads
  const createLinkedAdminUser = manageUsersApi.createLinkedCentralAdminUser
  const { createLinkedLsaUser } = manageUsersApi
  const { createLinkedGeneralUser } = manageUsersApi
  const searchUser = manageUsersApi.searchUserByUserName

  const { index: linkedDpsUser, post: postLinkedDpsUser } = createLinkedDpsUserFactory(
    getAllCaseloads,
    createLinkedAdminUser,
    createLinkedLsaUser,
    createLinkedGeneralUser,
    searchUser,
    '/create-linked-dps-user',
    '/create-dps-user',
  )

  router.get('/', linkedDpsUser)
  router.post('/', postLinkedDpsUser)

  return router
}

module.exports = (dependencies) => controller(dependencies)
