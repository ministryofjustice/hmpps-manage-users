import { PrisonUserDetails } from 'manageUsersApiClient'
import { NextFunction, RequestHandler, Request, Response } from 'express'
import { hasRole, HmppsUser } from '../../../interfaces/hmppsUser'
import { Services } from '../../../services'
import AuthRole from '../../../interfaces/authRole'
import logger from '../../../../logger'
import { UserParam } from '../../userCommon/paramTypes'

export const canChangeDpsUserEmail = async (
  hmppsUser: HmppsUser,
  staffUser: Pick<PrisonUserDetails, 'username' | 'accountType'>,
  { dpsUserService }: Services,
): Promise<boolean> => {
  if (hasRole(hmppsUser, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN)) {
    return true
  }

  if (!hasRole(hmppsUser, AuthRole.MAINTAIN_ACCESS_ROLES) || staffUser.accountType !== 'GENERAL') {
    return false
  }

  try {
    return await dpsUserService.isAdministeredBy(hmppsUser.token, staffUser.username)
  } catch (error) {
    logger.warn(`Unable to check if ${hmppsUser.username} administers ${staffUser.username}`, error)
    return false
  }
}

export const changeEmailAccessGuard =
  (services: Services): RequestHandler<UserParam> =>
  async (req: Request<UserParam>, res: Response, next: NextFunction) => {
    const hmppsUser: HmppsUser = res.locals.user
    if (hasRole(hmppsUser, AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN)) {
      return next()
    }
    const staffUser = await services.dpsUserService.getDpsUser(hmppsUser.token, req.params.userId)
    if (await canChangeDpsUserEmail(hmppsUser, staffUser, services)) {
      return next()
    }
    logger.error(`User ${hmppsUser.username} is not authorised to change the email of ${req.params.userId}`)
    return res.redirect('/authError')
  }
