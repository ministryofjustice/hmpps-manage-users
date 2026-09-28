import { UserGroup } from 'manageUsersApiClient'
import { SelectItem } from '../interfaces/selectItem'

const groupValues = (groups: UserGroup[]): SelectItem[] =>
  groups.map(group => ({
    text: group.groupName,
    value: group.groupCode,
  }))
export default groupValues
