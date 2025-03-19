import moment from 'moment/moment'
import { UserAllowlistDetail } from '../../@types/manageUsersApi'

export default function getAllowlistStatus(user: UserAllowlistDetail): string {
  const today = new Date().toISOString().split('T')[0]
  return moment(today).isAfter(user.allowlistEndDate) ? 'EXPIRED' : 'ACTIVE'
}
