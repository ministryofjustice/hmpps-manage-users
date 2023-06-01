const validateUserForSearch = (existingUsername) => {
  const errors = []
  if (!existingUsername) {
    errors.push({ href: '#existingUsername', text: 'Enter the existing username' })
  }
  if (errors.length) return errors
  if (existingUsername.length < 2) {
    errors.push({ href: '#existingUsername', text: 'Existing Username must be 2 characters or more' })
  } else if (existingUsername.length > 30) {
    errors.push({ href: '#existingUsername', text: 'Existing Username must be 30 characters or less' })
  }
  if (errors.length) return errors
  return errors
}

module.exports = {
  validateUserForSearch,
}
