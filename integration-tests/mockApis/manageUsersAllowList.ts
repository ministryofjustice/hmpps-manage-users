import { stubFor } from './wiremock'
import { UserAllowlistAddRequest } from '../../backend/@types/manageUsersApi'
import { getEndDate } from '../support/utils'

const getUserAllowlistDetail = (user: UserAllowlistAddRequest) => {
  return {
    id: 'a073bfc1-2f81-4b6d-9b9c-fd7c367fe4c7',
    username: `${user.username}`,
    email: `${user.email}`,
    firstName: `${user.firstName}`,
    lastName: `${user.lastName}`,
    reason: `${user.reason}`,
    createdOn: `${new Date('2024-03-19T04:39:08')}`,
    allowlistEndDate: `${getEndDate(user.accessPeriod)}`,
    lastUpdated: `${new Date('2024-03-19T04:39:08')}`,
    lastUpdatedBy: 'LAQUINAQNW',
  }
}

const stubAddAllowlistUser = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/users/allowlist',
    },
    response: {
      status: 201,
    },
  })

const stubUpdateAllowlistUser = () =>
  stubFor({
    request: {
      method: 'PATCH',
      urlPattern: `/users/allowlist/a073bfc1-2f81-4b6d-9b9c-fd7c367fe4c7`,
    },
    response: {
      status: 200,
    },
  })

const stubGetAllowlistUser = (user: UserAllowlistAddRequest) =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: `/users/allowlist/${user.username}`,
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: getUserAllowlistDetail(user),
    },
  })

export interface SearchAllowlistUserParams {
  expiredUser?: UserAllowlistAddRequest
  activeUser?: UserAllowlistAddRequest
  totalElements?: number
}

const defaultSearchParams: SearchAllowlistUserParams = {
  expiredUser: {
    username: 'AICIAD',
    email: 'anastazia.armistead@justice.gov.uk',
    firstName: 'Anastazia',
    lastName: 'Armistead',
    reason: 'For testing',
    accessPeriod: 'EXPIRE',
  },
  activeUser: {
    username: 'ZAFIRAHT9YH',
    email: 'litany.storm@justice.gov.uk',
    firstName: 'Litany',
    lastName: 'Storm',
    reason: 'For testing',
    accessPeriod: 'ONE_MONTH',
  },
  totalElements: 2,
}

const stubSearchAllowlistUser = (params: SearchAllowlistUserParams) => {
  const { expiredUser, activeUser, totalElements } = { ...defaultSearchParams, ...params }
  return stubFor({
    request: {
      method: 'GET',
      urlPath: '/users/allowlist',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        content: [getUserAllowlistDetail(expiredUser), getUserAllowlistDetail(activeUser)],
        pageable: {
          sort: {
            empty: false,
            sorted: true,
            unsorted: false,
          },
          offset: 0,
          pageSize: 10,
          pageNumber: 0,
          paged: true,
          unpaged: false,
        },
        last: false,
        totalPages: 1,
        totalElements,
        size: 2,
        number: 0,
        sort: {
          empty: false,
          sorted: true,
          unsorted: false,
        },
        first: true,
        numberOfElements: 2,
        empty: false,
      },
    },
  })
}

export default { stubAddAllowlistUser, stubGetAllowlistUser, stubUpdateAllowlistUser, stubSearchAllowlistUser }
