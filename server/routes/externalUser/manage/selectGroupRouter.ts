import { Request, Router } from 'express'
import { ExternalUser, UserGroup } from 'manageUsersApiClient'
import { Services } from '../../../services'
import { UserParam } from '../../userCommon/paramTypes'
import paths from '../../paths'
import { flashErrors, formErrorsFromFlash, validateFormOrRedirect } from '../../../middleware/route/formMiddleware'
import { FormError } from '../../../interfaces/formError'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'
import { HttpStatusCode, isErrorResponse } from '../../../utils/utils'
import groupValues from '../../../presentation/groups'
import { EventType } from '../../audit'

interface Form {
  group: string
}

const getPageData = async (token: string, userId: string, services: Services): Promise<[ExternalUser, UserGroup[]]> => {
  const { externalUserService } = services
  const [externalUser, assignableGroups, userGroups] = await Promise.all([
    externalUserService.getUser(token, userId),
    externalUserService.assignableGroups(token),
    externalUserService.getUserGroups(token, userId),
  ])
  const userGroupCodes = new Set(userGroups.map((g: UserGroup) => g.groupCode))
  return [externalUser, assignableGroups.filter((group: UserGroup) => !userGroupCodes.has(group.groupCode))]
}

const validate = (form: Form): FormError[] => {
  if (!form.group) {
    return [{ href: '#group', text: 'Select a group' }]
  }
  return []
}

export default (services: Services): Router => {
  const router = Router({ mergeParams: true })
  const { auditService, externalUserService } = services

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]))

  router.get('/', async (req: Request<UserParam>, res) => {
    const { userId } = req.params
    const { user } = res.locals

    const [externalUser, groups] = await getPageData(user.token, userId, services)

    return res.render('pages/addGroup', {
      staff: {
        ...externalUser,
        name: `${externalUser.firstName} ${externalUser.lastName}`,
      },
      staffUrl: paths.externalUser.manage.details({ userId }),
      searchTitle: 'Search for an external user',
      searchUrl: paths.externalUser.search.pattern,
      groupValues: groupValues(groups),
      errors: formErrorsFromFlash(req),
    })
  })

  router.post(
    '/',
    validateFormOrRedirect<Form, UserParam>(validate, req =>
      paths.externalUser.manage.selectGroup({ userId: req.params.userId }),
    ),
    async (req: Request<UserParam>, res) => {
      const { userId } = req.params
      const { group } = req.body
      const { username, token } = res.locals.user

      try {
        await externalUserService.addGroup(token, userId, group)
        await auditService.logAuditEvent({
          what: EventType.ADD_USER_GROUP,
          who: username,
          subjectId: userId,
          subjectType: 'USER_ID',
          details: { group },
        })
        return res.redirect(paths.externalUser.manage.details({ userId }))
      } catch (err) {
        if (!isErrorResponse(err)) {
          throw err
        }
        let errorText: string
        if (err.responseStatus === HttpStatusCode.FORBIDDEN) {
          errorText = 'You are not able to maintain this user anymore, user does not belong to any groups you manage'
        } else if (err.responseStatus === HttpStatusCode.CONFLICT) {
          errorText = 'User already belongs to that group'
        } else {
          throw err
        }
        flashErrors(req, [{ href: '#group', text: errorText }])
        return res.redirect(paths.externalUser.manage.selectGroup({ userId }))
      }
    },
  )

  return router
}
