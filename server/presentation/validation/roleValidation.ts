import { FormError } from '../../interfaces/formError'

export const validateRoleName = (roleName: string): FormError[] => {
  const errors: FormError[] = []
  if (!roleName) {
    errors.push({ href: '#roleName', text: 'Enter a role name' })
  } else {
    if (!roleName.match(/^[0-9A-Za-z- ,.()'&]*$/)) {
      errors.push({
        href: '#roleName',
        text: "Role name can only contain 0-9, a-z and ( ) & , - . ' characters",
      })
    }
    if (roleName.length < 4) {
      errors.push({ href: '#roleName', text: 'Role name must be 4 characters or more' })
    }
    if (roleName.length > 100) {
      errors.push({ href: '#roleName', text: 'Role name must be 100 characters or less' })
    }
  }
  return errors
}

export const validateRoleCode = (roleCode: string): FormError[] => {
  const errors: FormError[] = []
  if (!roleCode) {
    errors.push({ href: '#roleCode', text: 'Enter a role code' })
  } else {
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
  }

  return errors
}

export const validateRoleDescription = (roleDescription: string): FormError[] => {
  const errors: FormError[] = []
  if (!roleDescription) {
    return errors
  }
  if (!roleDescription.match(/^[0-9A-Za-z- ,.()'&\r\n]*$/)) {
    errors.push({
      href: '#roleDescription',
      text: "Role description can only contain 0-9, a-z, newline and ( ) & , - . ' characters",
    })
  }
  if (roleDescription.length > 1024) {
    errors.push({ href: '#roleDescription', text: 'Role description must be 1024 characters or less' })
  }
  return errors
}

export const validateRoleAdminType = (adminType: string[]): FormError[] => {
  const errors: FormError[] = []
  if (!adminType?.length) {
    errors.push({ href: '#adminType', text: 'Select an admin type' })
  }
  return errors
}
