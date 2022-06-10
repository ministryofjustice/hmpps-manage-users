export const validateEmailFormat = (email: string) => {
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

export default validateEmailFormat
