import { FormError } from '../../interfaces/formError'

interface RoleOption {
  text: string
  value: string
}

export const validateJiraReference = (body: { jiraReference?: string }): FormError[] => {
  if (!body.jiraReference || body.jiraReference.trim().length === 0) {
    return [{ text: 'jira reference is required and cannot be empty', href: '#jira-reference-input' }]
  }
  return []
}

export const validateSelectedRoles = (
  selectedRoles: string[],
  rolesList: RoleOption[],
  maxSelections: number,
): FormError[] => {
  if (selectedRoles.length === 0) {
    return [{ text: 'at least one role must be selected', href: '#select-roles-table' }]
  }
  if (selectedRoles.length > maxSelections) {
    return [
      {
        text: `a maximum of ${maxSelections} roles can be selected`,
        href: '#select-roles-table',
      },
    ]
  }
  const invalidRoles = selectedRoles.filter(s => !rolesList.some(r => s === r.value))
  if (invalidRoles.length > 0) {
    return [{ text: `invalid role value selected ${invalidRoles.join(', ')}`, href: '#select-roles-table' }]
  }
  return []
}
