const validateLinkedUserOptionSelection = (userExists) => {
  const errors = []
  if (!userExists) {
    errors.push({ href: '#userExists', text: 'Select if user has an existing account' })
  }
  return errors
}
const validateLinkedAdminUserCreate = (existingUsername, adminUsername) => {
  const errors = []
  if (!existingUsername) {
    errors.push({ href: '#existingUsername', text: 'Enter the existing username' })
  }
  if (existingUsername.length < 2) {
    errors.push({
      href: '#existingUsername',
      text: 'Existing Username must be 2 characters or more',
    })
  } else if (existingUsername.length > 30) {
    errors.push({ href: '#existingUsername', text: 'Existing Username must be 30 characters or less' })
  }

  if (!adminUsername) {
    errors.push({ href: '#adminUsername', text: 'Enter the Admin user name' })
  }
  if (adminUsername.length < 2) {
    errors.push({
      href: '#adminUsername',
      text: 'Admin user name must be 2 characters or more',
    })
  } else if (adminUsername.length > 30) {
    errors.push({ href: '#adminUsername', text: 'Admin Username must be 30 characters or less' })
  }
  if (errors.length) return errors
  return errors
}
const validateLinkedLsaUserCreate = (existingUsername, adminUsername, defaultCaseloadId) => {
  const errors = []
  if (!existingUsername) {
    errors.push({ href: '#existingUsername', text: 'Enter the existing username' })
  }
  if (existingUsername.length < 2) {
    errors.push({
      href: '#existingUsername',
      text: 'Existing Username must be 2 characters or more',
    })
  } else if (existingUsername.length > 30) {
    errors.push({ href: '#existingUsername', text: 'Existing Username must be 30 characters or less' })
  }

  if (!adminUsername) {
    errors.push({ href: '#adminUsername', text: 'Enter the Admin user name' })
  }
  if (adminUsername.length < 2) {
    errors.push({
      href: '#adminUsername',
      text: 'Admin user name must be 2 characters or more',
    })
  } else if (adminUsername.length > 30) {
    errors.push({ href: '#adminUsername', text: 'Admin Username must be 30 characters or less' })
  }

  if (!defaultCaseloadId || defaultCaseloadId === '--') {
    errors.push({ href: '#defaultCaseloadId', text: 'Select a case load' })
  }
  if (errors.length) return errors
  return errors
}
const validateLinkedGeneralUserCreate = (existingUsername, generalUsername, defaultCaseloadId) => {
  const errors = []
  if (!existingUsername) {
    errors.push({ href: '#existingUsername', text: 'Enter the existing username' })
  }
  if (existingUsername.length < 2) {
    errors.push({
      href: '#existingUsername',
      text: 'Existing Username must be 2 characters or more',
    })
  } else if (existingUsername.length > 30) {
    errors.push({ href: '#existingUsername', text: 'Existing Username must be 30 characters or less' })
  }

  if (!generalUsername) {
    errors.push({ href: '#generalUsername', text: 'Enter the General username' })
  }
  if (generalUsername.length < 2) {
    errors.push({
      href: '#generalUsername',
      text: 'General Username must be 2 characters or more',
    })
  } else if (generalUsername.length > 30) {
    errors.push({ href: '#generalUsername', text: 'General Username must be 30 characters or less' })
  }

  if (!defaultCaseloadId || defaultCaseloadId === '--') {
    errors.push({ href: '#defaultCaseloadId', text: 'Select a case load' })
  }

  if (errors.length) return errors
  return errors
}

module.exports = {
  validateLinkedUserOptionSelection,
  validateLinkedAdminUserCreate,
  validateLinkedLsaUserCreate,
  validateLinkedGeneralUserCreate,
}
