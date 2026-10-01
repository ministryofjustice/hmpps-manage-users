export interface UserParam {
  userId: string
}

export interface RoleParam extends UserParam {
  role: string
}

export interface CaseloadParam extends UserParam {
  caseload: string
}

export interface GroupParam extends UserParam {
  group: string
}

export interface CommonUser {
  username: string
  email: string
  firstName: string
  lastName: string
}

export type UserUrlProvider = (userId: string) => string
