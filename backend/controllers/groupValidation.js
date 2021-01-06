const validateGroupNameFormat = (groupName) => {
  const errors = []
  if (!groupName.match(/^[0-9A-Za-z- ,.()'&]*$/)) {
    errors.push({
      href: '#groupName',
      text: "Group name can only contain 0-9, a-z and ( ) & , - . '  characters",
    })
  }
  if (groupName.length < 4) {
    errors.push({ href: '#groupName', text: 'Group name must be 4 characters or more' })
  }
  if (groupName.length > 240) {
    errors.push({ href: '#groupName', text: 'Group name must be 240 characters or less' })
  }
  return errors
}

const validateGroupName = (groupName) => {
  if (!groupName) return [{ href: '#groupName', text: 'Enter a group name' }]

  return validateGroupNameFormat(groupName)
}

module.exports = { validateGroupName }
