import { RestrictedRoles, RestrictedRolesService } from './restrictedRolesService'

describe('the restricted roles service', () => {
  const restrictedRoles: RestrictedRoles[] = [
    {
      removalMessage: 'To remove this role, please raise a service now ticket',
      roleCodes: ['RESTRICTED_ROLE', 'DPS_ADM_ONLY_ROLE'],
    },
    {
      removalMessage: 'To remove this role, please contact the security administrator',
      roleCodes: ['VERY_RESTRICTED_ROLE', 'SECRET_ROLE'],
    },
  ]
  const restrictedRolesService: RestrictedRolesService = new RestrictedRolesService(restrictedRoles)

  it('returns false if role code is not in restricted roles', () => {
    expect(restrictedRolesService.isRestrictedRoleCode('NOT_A_RESTRICTED_ROLE')).toBe(false)
  })

  it('returns true if role code is in restricted roles', () => {
    expect(restrictedRolesService.isRestrictedRoleCode('RESTRICTED_ROLE')).toBe(true)
    expect(restrictedRolesService.isRestrictedRoleCode('DPS_ADM_ONLY_ROLE')).toBe(true)
    expect(restrictedRolesService.isRestrictedRoleCode('VERY_RESTRICTED_ROLE')).toBe(true)
    expect(restrictedRolesService.isRestrictedRoleCode('SECRET_ROLE')).toBe(true)
  })

  it('returns an empty string for the removal message if the role code is not in restricted roles', () => {
    expect(restrictedRolesService.getRemovalMessage('NOT_A_RESTRICTED_ROLE')).toBe('')
  })

  it('returns the correct removal message if the role code is in restricted roles', () => {
    expect(restrictedRolesService.getRemovalMessage('RESTRICTED_ROLE')).toBe(
      'To remove this role, please raise a service now ticket',
    )
    expect(restrictedRolesService.getRemovalMessage('DPS_ADM_ONLY_ROLE')).toBe(
      'To remove this role, please raise a service now ticket',
    )
    expect(restrictedRolesService.getRemovalMessage('VERY_RESTRICTED_ROLE')).toBe(
      'To remove this role, please contact the security administrator',
    )
    expect(restrictedRolesService.getRemovalMessage('SECRET_ROLE')).toBe(
      'To remove this role, please contact the security administrator',
    )
  })
})
