import { Request, Router } from 'express'
import { PrisonCaseload } from 'manageUsersApiClient'
import { Services } from '../../../services'
import { UserParam } from '../../userCommon/paramTypes'
import paths from '../../paths'
import { HmppsUser } from '../../../interfaces/hmppsUser'
import { caseloadDropdownValues } from '../../../presentation/caseloads'
import { formErrorsFromFlash, validateFormOrRedirect } from '../../../middleware/route/formMiddleware'
import { FormError } from '../../../interfaces/formError'
import { toArray } from '../../../utils/utils'
import AuthRole from '../../../interfaces/authRole'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import { EventType } from '../../audit'

interface Form {
  caseloads: string[]
}

const getPageData = async (user: HmppsUser, username: string, services: Services) => {
  const { dpsUserService } = services
  const { token } = user
  const [dpsUser, userCaseloads, allCaseloads] = await Promise.all([
    dpsUserService.getDpsUser(token, username),
    dpsUserService.getUserCaseloads(token, username),
    dpsUserService.getCaseloads(token),
  ])
  const userCaseloadIds = new Set(userCaseloads.caseloads.map((caseload: PrisonCaseload) => caseload.id))
  return [dpsUser, allCaseloads.filter((caseload: PrisonCaseload) => !userCaseloadIds.has(caseload.id))]
}

const validate = (form: Form): FormError[] => {
  const errors: FormError[] = []

  if (!form.caseloads) {
    errors.push({ href: '#caseloads', text: 'Select at least one caseload' })
  }

  return errors
}

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]))

  const { auditService, dpsUserService } = services

  router.get('/', async (req: Request<UserParam>, res) => {
    const { userId } = req.params
    const staffUrl = paths.dpsUser.manage.details({ userId })

    const [user, assignableCaseloads] = await getPageData(res.locals.user, userId, services)

    await auditService.logAuditEvent({
      what: EventType.VIEW_USER_CASELOADS,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })

    return res.render('pages/addUserCaseload', {
      staff: { ...user, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      caseloadDropdownValues: caseloadDropdownValues(assignableCaseloads),
      searchTitle: 'Search for a DPS user',
      searchUrl: paths.dpsUser.search.pattern,
      errors: formErrorsFromFlash(req),
    })
  })

  router.post(
    '/',
    validateFormOrRedirect<Form, UserParam>(validate, req =>
      paths.dpsUser.manage.selectCaseloads({ userId: req.params.userId }),
    ),
    async (req: Request<UserParam>, res) => {
      const { userId } = req.params
      const body: Form = { caseloads: toArray(req.body.caseloads) }
      const { username, token } = res.locals.user

      await dpsUserService.addCaseloads(token, userId, body.caseloads)

      await auditService.logAuditEvent({
        what: EventType.ADD_USER_CASELOADS,
        who: username,
        subjectId: userId,
        subjectType: 'USER_ID',
        details: { ...body },
      })

      return res.redirect(paths.dpsUser.manage.details({ userId }))
    },
  )

  return router
}
