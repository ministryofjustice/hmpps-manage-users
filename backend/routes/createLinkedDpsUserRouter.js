const express = require('express')
const { createLinkedDpsUserFactory } = require('../controllers/createLinkedDpsUser')

const router = express.Router({ mergeParams: true })

const controller = ({ nomisUsersAndRolesApi, manageUsersApi }) => {
  const getAllCaseloads = nomisUsersAndRolesApi.getCaseloads
  const createLinkedUser = manageUsersApi.createLinkedCentralAdminUser

  const { index: linkedDpsUser, post: postLinkedDpsUser } = createLinkedDpsUserFactory(
    getAllCaseloads,
    createLinkedUser,
    '/create-linked-dps-user',
    '/create-dps-user',
  )

  router.get('/', linkedDpsUser)
  router.post('/', postLinkedDpsUser)

  return router
}

module.exports = (dependencies) => controller(dependencies)
