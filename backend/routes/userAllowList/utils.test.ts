import moment from 'moment/moment'
import getAllowlistStatus from './utils'

describe('getAllowlistStatus', () => {
  it('returns EXPIRED if today is after user allow list expiry', () => {
    const result = getAllowlistStatus({
      createdOn: '',
      email: '',
      firstName: '',
      id: '',
      lastName: '',
      lastUpdated: '',
      lastUpdatedBy: '',
      reason: '',
      username: '',
      allowlistEndDate: moment(new Date()).subtract(1, 'day').format('YYYY-MM-DD'),
    })
    expect(result).toBe('EXPIRED')
  })

  it('returns ACTIVE if today is equal to user allow list expiry', () => {
    const result = getAllowlistStatus({
      createdOn: '',
      email: '',
      firstName: '',
      id: '',
      lastName: '',
      lastUpdated: '',
      lastUpdatedBy: '',
      reason: '',
      username: '',
      allowlistEndDate: moment(new Date()).format('YYYY-MM-DD'),
    })
    expect(result).toBe('ACTIVE')
  })

  it('returns ACTIVE if today is before user allow list expiry', () => {
    const result = getAllowlistStatus({
      createdOn: '',
      email: '',
      firstName: '',
      id: '',
      lastName: '',
      lastUpdated: '',
      lastUpdatedBy: '',
      reason: '',
      username: '',
      allowlistEndDate: moment(new Date()).add(1, 'day').format('YYYY-MM-DD'),
    })
    expect(result).toBe('ACTIVE')
  })
})
