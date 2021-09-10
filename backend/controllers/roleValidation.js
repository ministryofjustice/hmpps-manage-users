const validateRoleNameFormat = (roleName) => {
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

const validateRoleDescriptionFormat = (roleDescription) => {
  const errors = []
  if (!roleDescription) {
    return errors
  }
  if (!roleDescription.match(/^[0-9A-Za-z- ,.()'&\r\n]*$/)) {
    errors.push({
      href: '#roleDescription',
      text: "Role description can only contain 0-9, a-z and ( ) & , - . '  characters",
    })
  }
  if (roleDescription.length > 1024) {
    errors.push({ href: '#roleDescription', text: 'Role name must be 1024 characters or less' })
  }
  return errors
}

const validateRoleCodeFormat = (roleCode) => {
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
const validateRoleName = (roleName) => {
  if (!roleName) return [{ href: '#roleName', text: 'Enter a role name' }]

  return validateRoleNameFormat(roleName)
}

const validateCreateRole = ({ roleCode, roleName, roleDescription, adminType }) => {
  const errors = []

  if (!roleCode) {
    errors.push({ href: '#roleCode', text: 'Enter a role code' })
  }
  if (!roleName) {
    errors.push({ href: '#roleName', text: 'Enter a role name' })
  }
  if (!adminType?.length) {
    errors.push({ href: '#adminType', text: 'Select an admin type' })
  }

  if (errors.length) return errors

  errors.push(...validateRoleCodeFormat(roleCode))
  errors.push(...validateRoleNameFormat(roleName))
  errors.push(...validateRoleDescriptionFormat(roleDescription))

  return errors
}

module.exports = { validateRoleName, validateCreateRole }
