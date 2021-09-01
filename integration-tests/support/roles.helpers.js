// eslint-disable-next-line import/prefer-default-export
export const replicateRoles = (times) =>
  [...Array(times).keys()].map((i) => ({
    roleName: `Role Name ${i}`,
    roleCode: `rolecode${i}`,
  }))
