const express = require('express')
const { deleteEmailDomainFactory } = require('../controllers/deleteEmailDomain')

const router = express.Router({ mergeParams: true })

const controller = ({ manageUsersApi }) => {
  const deleteEmailDomainApi = manageUsersApi.deleteEmailDomain

  const { index: deleteEmailDomainLanding, post: deleteEmailDomainExec } = deleteEmailDomainFactory(
    deleteEmailDomainApi,
    '/email-domains',
  )

  router.get('/', deleteEmailDomainLanding)
  router.post('/', deleteEmailDomainExec)

  return router
}

module.exports = (dependencies) => controller(dependencies)
