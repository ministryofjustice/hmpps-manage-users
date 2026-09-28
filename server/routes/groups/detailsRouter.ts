import { Router } from 'express'
import { Services } from '../../services'
import { formErrorsFromFlash } from '../../middleware/route/formMiddleware'
import paths from '../paths'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { hasRole } from '../../interfaces/hmppsUser'
import { GroupRequest } from './types'
import { Page } from '../audit'

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]))

  router.get('/', async (req, res) => {
    const groupRequest = req as GroupRequest
    const { auditService } = services
    const { user } = res.locals
    const hasMaintainAuthUsers = hasRole(user, AuthRole.MAINTAIN_OAUTH_USERS)
    const errors = formErrorsFromFlash(req)
    const maintainUrl = paths.groups.list.pattern
    const { groupDetails } = groupRequest

    await auditService.logPageView(Page.VIEW_GROUP_DETAILS, {
      who: user.username,
      subjectId: groupDetails.groupCode,
      subjectType: 'GROUP_CODE',
    })

    return res.render('pages/groups/details', {
      groupDetails,
      hasMaintainAuthUsers,
      maintainUrl,
      errors,
    })
  })

  return router
}
