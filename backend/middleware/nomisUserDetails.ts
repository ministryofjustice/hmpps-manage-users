import { NextFunction, Request, RequestHandler, Response } from 'express'
import { manageUsersApiBuilder } from '../data'
import { PrisonUserDetails, Role } from '../@types/manageUsersApi'
import { RestrictedRoles } from '../services/restrictedRolesService'
import config from '../config'

export default function nomisUserDetails(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (res.locals.authSource === 'nomis') {
      const manageUsersApi = manageUsersApiBuilder(res.locals.access_token)
      const [dpsAdmRoles, lsaAdmRoles, imsRoles, dpsUser] = await Promise.all([
        manageUsersApi.getRoles('DPS_ADM'),
        manageUsersApi.getRoles('DPS_LSA'),
        manageUsersApi.getRoles('IMS_HIDDEN'),
        manageUsersApi.getDpsUser(req.session.userDetails.username),
      ])
      const roleRemovalLink = config.app.roleRemovalServiceNowLink
      const dpsAdminRestrictedRoles: RestrictedRoles = {
        removalMessage: `This role is centrally managed, please raise a <a class="govuk-link" href="${roleRemovalLink}">Service Now ticket</a> to get this role removed.`,
        roleCodes: dpsAdminOnlyRoleCodes(dpsAdmRoles, lsaAdmRoles),
      }
      const imsAdminRestrictedRoles: RestrictedRoles = {
        removalMessage:
          'If you require a users access to be removed from the Intelligence Management Service (IMS), the Head of Security (Prison roles) or Head of Unit (HQ roles) must contact <a class="govuk-link" href="mailto:nisst@justice.gov.uk">nisst@justice.gov.uk</a> directly.',
        roleCodes: imsRoles.map((role) => role.roleCode),
      }
      res.locals.restrictedRoles = isLocalAdmin(dpsUser)
        ? [imsAdminRestrictedRoles, dpsAdminRestrictedRoles]
        : [imsAdminRestrictedRoles]
    }
    next()
  }

  function dpsAdminOnlyRoleCodes(dpsAdminRoles: Role[], lsaAdminRoles: Role[]): string[] {
    const dpsAdminRoleCodes = dpsAdminRoles.map((role) => role.roleCode)
    const lsaAdminRoleCodes = lsaAdminRoles.map((role) => role.roleCode)
    return dpsAdminRoleCodes.filter((role) => !lsaAdminRoleCodes.includes(role))
  }

  function isLocalAdmin(dpsUser: PrisonUserDetails): boolean {
    return dpsUser.administratorOfUserGroups?.length > 0
  }
}
