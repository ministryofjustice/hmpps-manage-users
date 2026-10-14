import { FormError } from '../../interfaces/formError'
import { isAlphaStringOrSpecialChars } from '../../utils/utils'

export const validateEmail = (email: string): FormError[] => {
  const errors: FormError[] = []
  if (!email) {
    errors.push({ href: '#email', text: 'Enter an email address' })
  } else {
    if (!email.match(/.*@.*\..*/)) {
      errors.push({
        href: '#email',
        text: 'Enter an email address in the correct format, like first.last@justice.gov.uk',
      })
    }
    if (!email.match(/^[0-9A-Za-z@.'’_\-+]*$/)) {
      errors.push({
        href: '#email',
        text: "Email address can only contain 0-9, a-z, @, ', _, ., - and + characters",
      })
    }
    if (email.length > 240) {
      errors.push({ href: '#email', text: 'Email address must be 240 characters or less' })
    }
  }
  return errors
}

export const validateUsername = (
  username: string,
  fieldName: string = 'username',
  missingMessageSuffix: string = 'a username',
  lengthMessagePrefix: string = 'Username',
): FormError[] => {
  const errors: FormError[] = []
  if (!username) {
    errors.push({ href: `#${fieldName}`, text: `Enter ${missingMessageSuffix}` })
  } else if (username.length < 2) {
    errors.push({ href: `#${fieldName}`, text: `${lengthMessagePrefix} must be 2 characters or more` })
  } else if (username.length > 30) {
    errors.push({ href: `#${fieldName}`, text: `${lengthMessagePrefix} must be 30 characters or less` })
  }
  return errors
}

export const validateName = (
  value: string,
  fieldId: 'firstName' | 'lastName',
  fieldLabel: string,
  minLength: number,
  maxLength: number,
): FormError[] => {
  const errors: FormError[] = []
  if (!value) {
    errors.push({ href: `#${fieldId}`, text: `Enter a ${fieldLabel.toLowerCase()}` })
  } else if (value.length < minLength) {
    errors.push({ href: `#${fieldId}`, text: `${fieldLabel} must be ${minLength} characters or more` })
  } else if (value.length > maxLength) {
    errors.push({ href: `#${fieldId}`, text: `${fieldLabel} must be ${maxLength} characters or less` })
  } else if (!isAlphaStringOrSpecialChars(value)) {
    errors.push({
      href: `#${fieldId}`,
      text: `${fieldLabel} must consist of letters, an apostrophe & a hyphen only`,
    })
  }
  return errors
}
