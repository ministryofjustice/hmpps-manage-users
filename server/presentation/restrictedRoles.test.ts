import { RestrictedRoles, isRestrictedRoleCode, getRemovalMessage } from './restrictedRoles'

describe('Restricted roles', () => {
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

  it('returns false if role code is not in restricted roles', () => {
    expect(isRestrictedRoleCode('NOT_A_RESTRICTED_ROLE', restrictedRoles)).toBe(false)
  })

  it('returns true if role code is in restricted roles', () => {
    expect(isRestrictedRoleCode('RESTRICTED_ROLE', restrictedRoles)).toBe(true)
    expect(isRestrictedRoleCode('DPS_ADM_ONLY_ROLE', restrictedRoles)).toBe(true)
    expect(isRestrictedRoleCode('VERY_RESTRICTED_ROLE', restrictedRoles)).toBe(true)
    expect(isRestrictedRoleCode('SECRET_ROLE', restrictedRoles)).toBe(true)
  })

  it('returns an empty string for the removal message if the role code is not in restricted roles', () => {
    expect(getRemovalMessage('NOT_A_RESTRICTED_ROLE', restrictedRoles)).toBe('')
  })

  it('returns the correct removal message if the role code is in restricted roles', () => {
    expect(getRemovalMessage('RESTRICTED_ROLE', restrictedRoles)).toBe(
      'To remove this role, please raise a service now ticket',
    )
    expect(getRemovalMessage('DPS_ADM_ONLY_ROLE', restrictedRoles)).toBe(
      'To remove this role, please raise a service now ticket',
    )
    expect(getRemovalMessage('VERY_RESTRICTED_ROLE', restrictedRoles)).toBe(
      'To remove this role, please contact the security administrator',
    )
    expect(getRemovalMessage('SECRET_ROLE', restrictedRoles)).toBe(
      'To remove this role, please contact the security administrator',
    )
  })
})
