import { Request, RequestHandler, Response } from 'express'
import { UserRole } from 'manageUsersApiClient'
import { Services } from '../../services'
import { UserUrlProvider, UserParam, CommonUser } from './paramTypes'
import { roleDropdownValuesWithHint } from '../../presentation/roles'
import { formErrorsFromFlash } from '../../middleware/route/formMiddleware'
import { HmppsUser } from '../../interfaces/hmppsUser'
import { FormError } from '../../interfaces/formError'
import { toArray } from '../../utils/utils'
import { EventType } from '../audit'

export interface Form {
  roles: string[]
}

export const validate = (form: Form): FormError[] => {
  const errors: FormError[] = []

  if (!form.roles) {
    errors.push({ href: '#roles', text: 'Select at least one role' })
  }

  return errors
}

export type SelectRolesPageDataProvider<UserType> = (
  user: HmppsUser,
  userId: string,
  services: Services,
) => Promise<[UserType, UserRole[], string]>

export type IsUserActive<UserType> = (user: UserType) => boolean

export const selectRolesGetHandler = <UserType extends CommonUser>(
  services: Services,
  searchTitle: string,
  searchUrl: string,
  userDetailsUrlProvider: UserUrlProvider,
  selectRolesPageDataProvider: SelectRolesPageDataProvider<UserType>,
  isUserActive: IsUserActive<UserType>,
): RequestHandler<UserParam> => {
  return async (req: Request<UserParam>, res: Response) => {
    const { userId } = req.params
    const staffUrl = userDetailsUrlProvider(userId)
    const { user } = res.locals
    const { auditService } = services

    const [staffUser, assignableRoles, message] = await selectRolesPageDataProvider(user, userId, services)

    const roleDropdownValues = roleDropdownValuesWithHint(assignableRoles)

    await auditService.logAuditEvent({
      what: EventType.VIEW_USER_ROLES,
      who: user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
    })

    return res.render('pages/addRole', {
      staff: { ...staffUser, name: `${staffUser.firstName} ${staffUser.lastName}`, active: isUserActive(staffUser) },
      staffUrl,
      searchTitle,
      searchUrl,
      roleDropdownValues,
      message,
      errors: formErrorsFromFlash(req),
    })
  }
}

export type RolesAdder = (services: Services, token: string, userId: string, roles: string[]) => Promise<unknown>

export const selectRolesPostHandler = (
  services: Services,
  rolesAdder: RolesAdder,
  detailsRedirectUrlProvider: UserUrlProvider,
): RequestHandler<UserParam> => {
  return async (req: Request<UserParam>, res: Response) => {
    const { userId } = req.params
    const body: Form = { roles: toArray(req.body.roles) }
    const { username, token } = res.locals.user
    const { auditService } = services

    await rolesAdder(services, token, userId, body.roles)

    await auditService.logAuditEvent({
      what: EventType.ADD_USER_ROLES,
      who: username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { ...body },
    })

    return res.redirect(detailsRedirectUrlProvider(userId))
  }
}
