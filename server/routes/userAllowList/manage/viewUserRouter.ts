import { Request, Router } from 'express'
import { Services } from '../../../services'
import AuthRole from '../../../interfaces/authRole'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import paths from '../../paths'
import { UserParam } from '../paramTypes'
import { getAllowlistStatus } from '../../../presentation/userAllowList'
import { Page } from '../../audit'

export default ({ userAllowListService, auditService }: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MANAGE_USER_ALLOW_LIST]))

  router.get('/', async (req: Request<UserParam>, res) => {
    const { username } = req.params
    const allowlistUser = await userAllowListService.getAllowListUser(res.locals.user.token, username)

    await auditService.logPageView(Page.VIEW_ALLOW_LIST_USER, {
      who: res.locals.user.username,
      subjectId: allowlistUser.id,
      subjectType: 'USER_ID',
    })

    return res.render('pages/userAllowList/viewUser', {
      ...allowlistUser,
      editUrl: paths.userAllowList.manage.edit({ username }),
      searchUrl: paths.userAllowList.search.pattern,
      status: getAllowlistStatus(allowlistUser),
    })
  })

  return router
}
