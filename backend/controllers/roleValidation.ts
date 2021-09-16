const validateRoleNameFormat = (roleName: string) => {
  const errors = []
  if (!roleName.match(/^[0-9A-Za-z- ,.()'&]*$/)) {
    errors.push({
      href: '#roleName',
      text: "Role name can only contain 0-9, a-z and ( ) & , - . '  characters",
    })
  }
  if (roleName.length < 4) {
    errors.push({ href: '#roleName', text: 'Role name must be 4 characters or more' })
  }
  if (roleName.length > 100) {
    errors.push({ href: '#roleName', text: 'Role name must be 100 characters or less' })
  }
  return errors
}

const validateRoleCodeFormat = (roleCode: string) => {
  const errors = []
  if (!roleCode.match(/^[0-9A-Z_]*$/)) {
    errors.push({
      href: '#roleCode',
      text: 'Role code can only contain 0-9, A-Z and _ characters',
    })
  }

  if (roleCode.length < 2) {
    errors.push({ href: '#roleCode', text: 'Role code must be 2 characters or more' })
  }
  if (roleCode.length > 30) {
    errors.push({ href: '#roleCode', text: 'Role code must be 30 characters or less' })
  }

  return errors
}
const validateRoleName = (roleName: string) => {
  if (!roleName) return [{ href: '#roleName', text: 'Enter a role name' }]

  return validateRoleNameFormat(roleName)
}

const validateRoleDescriptionFormat = (roleDescription: string) => {
  const errors: { href: string; text: string }[] = []
  if (!roleDescription) {
    return errors
  }
  if (!roleDescription.match(/^[0-9A-Za-z- ,.()'&\r\n]*$/)) {
    errors.push({
      href: '#roleDescription',
      text: "Role description can only contain 0-9, a-z, newline and ( ) & , - . '  characters",
    })
  }
  if (roleDescription.length > 1024) {
    errors.push({ href: '#roleDescription', text: 'Role description must be 1024 characters or less' })
  }
  return errors
}

const validateRoleDescription = (roleDescription: string) => {
  return validateRoleDescriptionFormat(roleDescription)
}

const validateRoleAdminType = (adminType: string[]) => {
  const errors = []
  if (!adminType?.length) {
    errors.push({ href: '#adminType', text: 'Select an admin type' })
  }
  return errors
}

const validateCreateRole = (obj: {
  roleCode: string
  roleName: string
  roleDescription: string
  adminType: string[]
}) => {
  const errors = []

  if (!obj.roleCode) {
    errors.push({ href: '#roleCode', text: 'Enter a role code' })
  }
  if (!obj.roleName) {
    errors.push({ href: '#roleName', text: 'Enter a role name' })
  }
  if (!obj.adminType?.length) {
    errors.push({ href: '#adminType', text: 'Select an admin type' })
  }

  if (errors.length) return errors

  errors.push(...validateRoleCodeFormat(obj.roleCode))
  errors.push(...validateRoleNameFormat(obj.roleName))
  errors.push(...validateRoleDescriptionFormat(obj.roleDescription))

  return errors
}

module.exports = { validateRoleName, validateRoleDescription, validateCreateRole, validateRoleAdminType }
