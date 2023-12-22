export interface Role {
    roleCode: string,
    roleName: string,
    roleDescription: string,
    adminType: AdminType[],
}

export interface AdminType {
    adminTypeCode: string,
    adminTypeName: string,
}