const express = require('express')
const { createEmailDomainFactory } = require('../controllers/addEmailDomain')

const router = express.Router({ mergeParams: true })
const controller = ({ manageUsersApi }) => {
  const createEmailDomainApi = manageUsersApi.createEmailDomain

  const { index: createEmailDomainIndex, createEmailDomain: createEmailDomainExec } = createEmailDomainFactory(
    createEmailDomainApi,
    '/create-email-domain',
    '/email-domains',
  )

  router.get('/', createEmailDomainIndex)
  router.post('/', createEmailDomainExec)

  return router
}

module.exports = (dependencies) => controller(dependencies)
