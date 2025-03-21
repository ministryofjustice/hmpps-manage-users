import { stubFor } from './wiremock'

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

export default { stubAddAllowlistUser, stubSearchAllowlistUser }
