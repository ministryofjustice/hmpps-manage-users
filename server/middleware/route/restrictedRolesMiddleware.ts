import { NextFunction, Request, RequestHandler, Response } from 'express'
import { PrisonUserDetails, Role } from 'manageUsersApiClient'
import { Services } from '../../services'
import { RestrictedRoles } from '../../presentation/restrictedRoles'
import config from '../../config'

const dpsAdminOnlyRoleCodes = (dpsAdminRoles: Role[], lsaAdminRoles: Role[]): string[] => {
  const dpsAdminRoleCodes = dpsAdminRoles.map(role => role.roleCode)
  const lsaAdminRoleCodes = lsaAdminRoles.map(role => role.roleCode)
  return dpsAdminRoleCodes.filter(role => !lsaAdminRoleCodes.includes(role))
}

const isLocalAdmin = (dpsUser: PrisonUserDetails): boolean => dpsUser.administratorOfUserGroups?.length > 0

const setupRestrictedRoles =
  <Params>({ dpsUserService, rolesService }: Services): RequestHandler<Params> =>
  async (_req: Request<Params>, res: Response, next: NextFunction) => {
    if (res.locals.user.authSource === 'nomis') {
      const { token } = res.locals.user
      const [dpsAdmRoles, lsaAdmRoles, imsRoles, dpsUser] = await Promise.all([
        rolesService.getRoles(token, 'DPS_ADM'),
        rolesService.getRoles(token, 'DPS_LSA'),
        rolesService.getRoles(token, 'IMS_HIDDEN'),
        dpsUserService.getDpsUser(token, res.locals.user.username),
      ])
      const roleRemovalLink = config.app.roleRemovalServiceNowLink
      const dpsAdminRestrictedRoles: RestrictedRoles = {
        removalMessage: `This role is centrally managed, please raise a <a class="govuk-link" href="${roleRemovalLink}">Service Now ticket</a> to get this role removed.`,
        roleCodes: dpsAdminOnlyRoleCodes(dpsAdmRoles, lsaAdmRoles),
      }
      const imsAdminRestrictedRoles: RestrictedRoles = {
        removalMessage:
          'If you require a users access to be removed from the Intelligence Management Service (IMS), the Head of Security (Prison roles) or Head of Unit (HQ roles) must contact <a class="govuk-link" href="mailto:nisst@justice.gov.uk">nisst@justice.gov.uk</a> directly.',
        roleCodes: imsRoles.map((role: Role) => role.roleCode),
      }
      res.locals.restrictedRoles = isLocalAdmin(dpsUser)
        ? [imsAdminRestrictedRoles, dpsAdminRestrictedRoles]
        : [imsAdminRestrictedRoles]
    }
    next()
  }

export default setupRestrictedRoles
