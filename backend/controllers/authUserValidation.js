const validateSearch = (user) => {
  if (!user || !user.trim()) {
    return [{ href: '#user', text: 'Enter a username or email address' }]
  }
  if (!user.includes('@') && !/^[a-zA-Z0-9_]*$/.test(user.trim())) {
    return [{ href: '#user', text: 'Username can only include letters, numbers and _' }]
  }
  return []
}

const validateEmailFormat = (email) => {
  const errors = []
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
  return errors
}

const validateCreate = ({ email, firstName, lastName, groupCode }, groupManager) => {
  const errors = []

  if (!email) {
    errors.push({ href: '#email', text: 'Enter an email address' })
  }
  if (!firstName) {
    errors.push({ href: '#firstName', text: 'Enter a first name' })
  }
  if (!lastName) {
    errors.push({ href: '#lastName', text: 'Enter a last name' })
  }
  // group code required for group managers
  if (groupManager && (!groupCode || groupCode === '--')) {
    errors.push({ href: '#groupCode', text: 'Select a group' })
  }

  if (errors.length) return errors

  errors.push(...validateEmailFormat(email))

  if (firstName.length < 2) {
    errors.push({ href: '#firstName', text: 'First name must be 2 characters or more' })
  }
  if (firstName.length > 50) {
    errors.push({ href: '#firstName', text: 'First name must be 50 characters or less' })
  }
  if (lastName.length < 2) {
    errors.push({ href: '#lastName', text: 'Last name must be 2 characters or more' })
  }
  if (lastName.length > 50) {
    errors.push({ href: '#lastName', text: 'Last name must be 50 characters or less' })
  }

  return errors
}

const validateChangeEmail = (email) => {
  if (!email) return [{ href: '#email', text: 'Enter an email address' }]

  return validateEmailFormat(email)
}

module.exports = { validateSearch, validateCreate, validateChangeEmail }
