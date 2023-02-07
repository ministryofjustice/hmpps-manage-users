const express = require('express')
const { createEmailDomainFactory } = require('../controllers/addEmailDomain')

const router = express.Router({ mergeParams: true })
const controller = ({ manageUsersApi }) => {
  const createEmailDomainApi = manageUsersApi.createEmailDomain

  const { index: createEmailIndex, post: createEmailExec } = createEmailDomainFactory(
    createEmailDomainApi,
    '/create-email-domain',
    '/email-domains',
  )

  router.get('/', createEmailIndex)
  router.post('/', createEmailExec)

  return router
}

module.exports = (dependencies) => controller(dependencies)
