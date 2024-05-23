export interface PrisonUserFilter {
  name?: string
  status?: string
  activeCaseloadId?: string
  caseloadId?: string
  roleCodes?: string[]
  nomisRoleCode?: string
  inclusiveRoles?: boolean
  showOnlyLSAs?: boolean
}
