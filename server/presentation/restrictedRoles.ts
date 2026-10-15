export interface RestrictedRoles {
  removalMessage: string
  roleCodes: string[]
}

export const isRestrictedRoleCode = (roleCode: string, restrictedRoles: RestrictedRoles[]): boolean =>
  restrictedRoles.flatMap(restricted => restricted.roleCodes).includes(roleCode)

export const getRemovalMessage = (restrictedRoleCode: string, restrictedRoles: RestrictedRoles[]): string =>
  restrictedRoles.find(restricted => restricted.roleCodes.includes(restrictedRoleCode))?.removalMessage ?? ''
