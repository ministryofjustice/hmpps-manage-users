interface User {
    username: string
    firstName: string
    lastName: string
    name: string
    activeCaseLoadId: string
}

interface ExternalUser {
    userid: string
    username: string
    email: string
    firstName: string
    lastName: string
    groupCodes: string[]
    roleCodes: string[]
    enabled: string
    locked: string
    verified: string
    reason: string
}

interface PrisonUser {
    username: string
    staffId: number
    firstName: string
    lastName: string
    activeCaseloadId: string
    accountStatus: string
    accountType: string
    primaryEmail: string
    dpsRoleCodes: string[]
    accountNonLocked: boolean
    credentialsNonExpired: boolean
    enabled: boolean
    admin: boolean
    active: boolean
}

interface Account {
    username: string
}

interface LinkedLsaUser {
    staffId: number,
    firstName: string,
    lastName: string,
    status: string,
    primaryEmail: string
    adminAccount?: Account
    generalAccount?: Account
}