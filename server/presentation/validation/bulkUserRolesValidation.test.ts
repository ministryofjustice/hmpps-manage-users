import { validateJiraReference, validateSelectedRoles } from './bulkUserRolesValidation'

describe('validateJiraReference', () => {
  it('returns an error when jiraReference is missing', () => {
    expect(validateJiraReference({})).toEqual([
      { text: 'jira reference is required and cannot be empty', href: '#jira-reference-input' },
    ])
  })

  it('returns an error when jiraReference is only whitespace', () => {
    expect(validateJiraReference({ jiraReference: '   ' })).toEqual([
      { text: 'jira reference is required and cannot be empty', href: '#jira-reference-input' },
    ])
  })

  it('returns no errors when jiraReference is present', () => {
    expect(validateJiraReference({ jiraReference: 'JIRA-1' })).toEqual([])
  })
})

describe('validateSelectedRoles', () => {
  const rolesList = [
    { text: 'Role 1', value: 'ROLE_1' },
    { text: 'Role 2', value: 'ROLE_2' },
  ]

  it('returns an error when no roles are selected', () => {
    expect(validateSelectedRoles([], rolesList, 5)).toEqual([
      { text: 'at least one role must be selected', href: '#select-roles-table' },
    ])
  })

  it('returns an error when too many roles are selected', () => {
    expect(validateSelectedRoles(['ROLE_1', 'ROLE_2'], rolesList, 1)).toEqual([
      { text: 'a maximum of 1 roles can be selected', href: '#select-roles-table' },
    ])
  })

  it('returns an error when an invalid role is selected', () => {
    expect(validateSelectedRoles(['ROLE_1', 'ROLE_INVALID'], rolesList, 5)).toEqual([
      { text: 'invalid role value selected ROLE_INVALID', href: '#select-roles-table' },
    ])
  })

  it('returns no errors when a valid selection is made', () => {
    expect(validateSelectedRoles(['ROLE_1'], rolesList, 5)).toEqual([])
  })
})
