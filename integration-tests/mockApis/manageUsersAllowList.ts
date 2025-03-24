import { stubFor } from './wiremock'
import { UserAllowlistAddRequest } from '../../backend/@types/manageUsersApi'
import { getEndDate } from '../support/utils'

const stubAddAllowlistUser = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/users/allowlist',
    },
    response: {
      status: 201,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
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
      jsonBody: {
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
      },
    },
  })

const stubSearchAllowlistUser = () =>
  stubFor({
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
        content: [
          {
            id: '7dd658d9-8918-4650-9555-2df4b89e0d15',
            username: 'AICIAD',
            email: 'anastazia.armistead@justice.gov.uk',
            firstName: 'Anastazia',
            lastName: 'Armistead',
            reason: 'For testing',
            createdOn: `${new Date('2024-03-19T04:39:08')}`,
            allowlistEndDate: `${new Date('2025-03-19')}`,
            lastUpdated: `${new Date('2024-03-19T04:39:08')}`,
            lastUpdatedBy: 'LAQUINAQNW',
          },
          {
            id: '7dd658d9-8918-4650-9555-2df4b89e0d15',
            username: 'ZAFIRAHT9YH',
            email: 'litany.storm@justice.gov.uk',
            firstName: 'Litany',
            lastName: 'Storm',
            reason: 'For testing',
            createdOn: `${new Date('2025-03-19T04:39:08')}`,
            allowlistEndDate: `${new Date('2025-06-19')}`,
            lastUpdated: `${new Date('2025-03-19T04:39:08')}`,
            lastUpdatedBy: 'ZAIRAKB',
          },
        ],
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
        totalElements: 2,
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

export default { stubAddAllowlistUser, stubGetAllowlistUser, stubSearchAllowlistUser }
