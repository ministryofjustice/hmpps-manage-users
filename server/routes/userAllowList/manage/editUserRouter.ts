import { Request, Response, Router } from 'express'
import { UserAllowlistPatchRequest } from 'manageUsersApiClient'
import { Services } from '../../../services'
import paths from '../../paths'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'
import { bodyFromFlash, formErrorsFromFlash, validateFormOrRedirect } from '../../../middleware/route/formMiddleware'
import { FormError } from '../../../interfaces/formError'
import { getAllowlistStatus } from '../../../presentation/userAllowList'
import { UserParam } from '../paramTypes'
import { EventType } from '../../audit'

type Form = UserAllowlistPatchRequest & { id: string }

const validate = (body: UserAllowlistPatchRequest): FormError[] => {
  const errors: FormError[] = []
  if (!body.reason?.trim()) {
    errors.push({ href: '#reason', text: 'Enter a valid business reason' })
  }
  return errors
}

export default ({ userAllowListService, auditService }: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MANAGE_USER_ALLOW_LIST]))

  router.get('/', async (req: Request<UserParam>, res: Response) => {
    const { username } = req.params
    const user = await userAllowListService.getAllowListUser(res.locals.user.token, username)
    const body = bodyFromFlash<UserAllowlistPatchRequest>(req)
    const accessPeriod = body?.accessPeriod ?? 'ONE_MONTH'

    return res.render('pages/userAllowList/editUser', {
      user,
      ...body,
      accessPeriod,
      errors: formErrorsFromFlash(req),
      searchUrl: paths.userAllowList.search.pattern,
      status: getAllowlistStatus(user),
    })
  })

  router.post(
    '/',
    validateFormOrRedirect<Form, UserParam>(validate, req =>
      paths.userAllowList.manage.edit({ username: req.params.username }),
    ),
    async (req: Request<UserParam>, res: Response) => {
      const { username } = req.params
      const body = bodyFromFlash<Form>(req)

      await userAllowListService.updateAllowListUserAccess(res.locals.user.token, body.id, {
        reason: body.reason,
        accessPeriod: body.accessPeriod,
      } as UserAllowlistPatchRequest)

      await auditService.logAuditEvent({
        what: EventType.UPDATE_ALLOW_LIST_USER,
        who: res.locals.user.username,
        subjectId: body.id,
        subjectType: 'USER_ID',
        details: body,
      })
      return res.redirect(paths.userAllowList.manage.view({ username }))
    },
  )

  return router
}
