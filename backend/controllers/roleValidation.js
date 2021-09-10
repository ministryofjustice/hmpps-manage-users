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

const validateRoleName = (roleName) => {
  if (!roleName) return [{ href: '#roleName', text: 'Enter a role name' }]

  return validateRoleNameFormat(roleName)
}

const validateRoleDescriptionFormat = (roleDescription) => {
  const errors = []
  if (!roleDescription.match(/^[0-9A-Za-z- ,.()'&]*$/)) {
    errors.push({
      href: '#roleDescription',
      text: "Role description can only contain 0-9, a-z and ( ) & , - . '  characters",
    })
  }
  if (roleDescription.length > 1024) {
    errors.push({ href: '#roleDescription', text: 'Role description must be 1024 characters or less' })
  }
  return errors
}

const validateRoleDescription = (roleDescription) => {
  if (!roleDescription) return []

  return validateRoleDescriptionFormat(roleDescription)
}

module.exports = { validateRoleName, validateRoleDescription }
