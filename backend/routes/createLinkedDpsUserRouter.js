const express = require('express')
const { createLinkedDpsUserFactory } = require('../controllers/createLinkedDpsUser')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const getAllCaseloads = manageUsersApi.getCaseloads
  const createLinkedAdminUser = manageUsersApi.createLinkedCentralAdminUser
  const { createLinkedLsaUser } = manageUsersApi
  const { createLinkedGeneralUser } = manageUsersApi
  const { getDpsUser } = manageUsersApi

  const { index: linkedDpsUser, post: postLinkedDpsUser } = createLinkedDpsUserFactory(
    getAllCaseloads,
    createLinkedAdminUser,
    createLinkedLsaUser,
    createLinkedGeneralUser,
    getDpsUser,
    '/create-linked-dps-user',
    '/create-dps-user',
    '/create-user',
    '/manage-dps-users',
  )

  router.get('/', linkedDpsUser)
  router.post('/', postLinkedDpsUser)

  return router
}

module.exports = (dependencies) => controller(dependencies)
