import { PrisonCaseload } from 'manageUsersApiClient'
import { SelectItem } from '../interfaces/selectItem'

export const caseloadDropdownValues = (caseloads: PrisonCaseload[]): SelectItem[] =>
  caseloads.map(caseload => ({
    text: caseload.name,
    value: caseload.id,
  }))

export const sortAlphabetically = (caseload1: PrisonCaseload, caseload2: PrisonCaseload): number => {
  if (caseload1.name < caseload2.name) {
    return -1
  }
  if (caseload1.name > caseload2.name) {
    return 1
  }
  return 0
}
