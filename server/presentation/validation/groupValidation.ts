import { FormError } from '../../interfaces/formError'

export const validateGroupName = (groupName: string): FormError[] => {
  const errors: FormError[] = []
  if (!groupName) {
    errors.push({ href: '#groupName', text: 'Enter a group name' })
  } else {
    if (!groupName.match(/^[0-9A-Za-z- ,.()'&]*$/)) {
      errors.push({
        href: '#groupName',
        text: "Group name can only contain 0-9, a-z and ( ) & , - . ' characters",
      })
    }
    if (groupName.length < 4) {
      errors.push({ href: '#groupName', text: 'Group name must be 4 characters or more' })
    }
    if (groupName.length > 100) {
      errors.push({ href: '#groupName', text: 'Group name must be 100 characters or less' })
    }
  }
  return errors
}

export const validateGroupCode = (groupCode: string): FormError[] => {
  const errors: FormError[] = []

  if (!groupCode) {
    errors.push({ href: '#groupCode', text: 'Enter a group code' })
  } else {
    if (!groupCode.match(/^[0-9A-Z_]*$/)) {
      errors.push({
        href: '#groupCode',
        text: 'Group code can only contain 0-9, A-Z and _ characters',
      })
    }

    if (groupCode.length < 2) {
      errors.push({ href: '#groupCode', text: 'Group code must be 2 characters or more' })
    }
    if (groupCode.length > 30) {
      errors.push({ href: '#groupCode', text: 'Group code must be 30 characters or less' })
    }
  }

  return errors
}
