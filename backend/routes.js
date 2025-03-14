const express = require('express')

const menuRouter = require('./routes/menuRouter')
const manageAuthUserRouter = require('./routes/manageAuthUserRouter')
const searchExternalUserRouter = require('./routes/searchExternalUserRouter')
const searchDpsUserRouter = require('./routes/searchDpsUserRouter')
const createExternalUserRouter = require('./routes/createExternalUserRouter')
const creatUserOptionsRouter = require('./routes/createUserOptionsRouter')
const creatUserRouter = require('./routes/createUserRouter')
const createLinkedDpsUserRouter = require('./routes/createLinkedDpsUserRouter')
const createDpsUserRouter = require('./routes/createDpsUserRouter')
const manageDpsUserRouter = require('./routes/manageDpsUserRouter')
const manageGroupsRouter = require('./routes/manageGroupsRouter')
const manageRolesRouter = require('./routes/manageRolesRouter')
const manageEmailDomainsRouter = require('./routes/manageEmailDomainsRouter')
const createEmailDomainsRouter = require('./routes/createEmailDomainRouter')
const deleteEmailDomainsRouter = require('./routes/deleteEmailDomainRouter')
const userAllowListRouter = require('./routes/userAllowList').default
const currentUser = require('./middleware/currentUser')
const featureSwitches = require('./middleware/featureSwitches')
const config = require('./config').default

const configureRoutes = ({ manageUsersApi }) => {
  const router = express.Router()

  router.use(currentUser({ manageUsersApi }))
  router.use(featureSwitches(config))

  router.use('/', menuRouter({ manageUsersApi }))
  router.use('/create-user', creatUserRouter())
  router.use('/create-user-options', creatUserOptionsRouter())
  router.use('/create-linked-dps-user', createLinkedDpsUserRouter({ manageUsersApi }))
  router.use('/create-dps-user', createDpsUserRouter({ manageUsersApi }))
  router.use('/create-external-user', createExternalUserRouter({ manageUsersApi }))
  router.use('/search-external-users', searchExternalUserRouter({ manageUsersApi }))
  router.use('/search-with-filter-dps-users', searchDpsUserRouter({ manageUsersApi }))
  router.use('/manage-external-users/:userId', manageAuthUserRouter({ manageUsersApi }))
  router.use('/manage-dps-users/:userId', manageDpsUserRouter({ manageUsersApi }))
  router.use('/manage-groups', manageGroupsRouter({ manageUsersApi }))
  router.use('/manage-roles', manageRolesRouter({ manageUsersApi }))
  router.use('/email-domains', manageEmailDomainsRouter({ manageUsersApi }))
  router.use('/create-email-domain', createEmailDomainsRouter({ manageUsersApi }))
  router.use('/delete-email-domain?id=:domainId&name=:domainName', deleteEmailDomainsRouter({ manageUsersApi }))
  router.use('/delete-email-domain', deleteEmailDomainsRouter({ manageUsersApi }))
  router.use(userAllowListRouter())

  return router
}

module.exports = configureRoutes
