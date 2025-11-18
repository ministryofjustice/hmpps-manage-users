export interface RestrictedRoles {
  removalMessage: string
  roleCodes: string[]
}

export class RestrictedRolesService {
  restrictedRoles: RestrictedRoles[]

  constructor(restrictedRoles: RestrictedRoles[]) {
    this.restrictedRoles = restrictedRoles
  }

  public isRestrictedRoleCode(roleCode: string): boolean {
    return this.restrictedRoles.flatMap((restricted) => restricted.roleCodes).includes(roleCode)
  }

  public getRemovalMessage(restrictedRoleCode: string): string {
    return (
      this.restrictedRoles.find((restricted) => restricted.roleCodes.includes(restrictedRoleCode))?.removalMessage ?? ''
    )
  }
}
