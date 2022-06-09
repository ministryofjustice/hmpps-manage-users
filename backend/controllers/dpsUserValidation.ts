import { validateEmailFormat } from './userValidation'

const isAlphaString = (str: string) => str.match(/^[A-Za-z]+$/)

const validateDpsUserCreate = (
  username: string,
  email: string,
  firstName: string,
  lastName: string,
  defaultCaseloadId: string,
  validateCaseload: boolean,
) => {
  const errors = []

  if (!username) {
    errors.push({ href: '#username', text: 'Enter a username' })
  }
  if (!email) {
    errors.push({ href: '#email', text: 'Enter an email address' })
  }
  if (!firstName) {
    errors.push({ href: '#firstName', text: 'Enter a first name' })
  }
  if (!lastName) {
    errors.push({ href: '#lastName', text: 'Enter a last name' })
  }
  if (validateCaseload && (!defaultCaseloadId || defaultCaseloadId === '--')) {
    errors.push({ href: '#defaultCaseloadId', text: 'Select a default caseload' })
  }

  if (errors.length) return errors

  if (username.length < 2) {
    errors.push({ href: '#username', text: 'Username must be 2 characters or more' })
  } else if (username.length > 30) {
    errors.push({ href: '#username', text: 'Username must be 35 characters or less' })
  }
  if (firstName.length < 2) {
    errors.push({ href: '#firstName', text: 'First name must be 2 characters or more' })
  } else if (firstName.length > 35) {
    errors.push({ href: '#firstName', text: 'First name must be 35 characters or less' })
  } else if (!isAlphaString(firstName)) {
    errors.push({ href: '#firstName', text: 'First name must be consist of letters only' })
  }
  if (lastName.length < 2) {
    errors.push({ href: '#lastName', text: 'Last name must be 2 characters or more' })
  } else if (lastName.length > 35) {
    errors.push({ href: '#lastName', text: 'Last name must be 35 characters or less' })
  } else if (!isAlphaString(lastName)) {
    errors.push({ href: '#lastName', text: 'Last name must be consist of letters only' })
  }

  if (errors.length) return errors

  errors.push(...validateEmailFormat(email))

  return errors
}

module.exports = { validateDpsUserCreate }
