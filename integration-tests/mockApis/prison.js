const { stubFor, getFor, getMatchingRequests } = require('./wiremock')

const replicateUser = (times) =>
  [...Array(times).keys()].map((i) => ({
    username: `ITAG_USER${i}`,
    active: i % 2 === 0,
    firstName: 'Itag',
    lastName: `User${i}`,
    activeCaseLoadId: 'BXI',
  }))

const replicateInactiveUser = (times) =>
  [...Array(times).keys()].map((i) => ({
    username: `ITAG_USER${i}`,
    active: 0,
    firstName: 'Itag',
    lastName: `User${i}`,
    activeCaseLoadId: 'BXI',
  }))

module.exports = {
  stubHealth: (status = 200) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/health/ping',
      },
      response: {
        status,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        fixedDelayMilliseconds: status === 500 ? 5000 : '',
      },
    })
  },

  stubDpsSearch: ({ totalElements = 1, page = 0, size = 10 }) =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/api/users/local-administrator/available',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'total-records': `${totalElements}`,
          'page-offset': `${page * size}`,
          'page-limit': `${size}`,
        },
        jsonBody: replicateUser(Math.floor(totalElements / size) === page ? totalElements % size : size),
      },
    }),
  stubDpsSearchInactive: ({ totalElements = 1, page = 0, size = 10 }) =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/api/users/local-administrator/available',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'total-records': `${totalElements}`,
          'page-offset': `${page * size}`,
          'page-limit': `${size}`,
        },
        jsonBody: replicateInactiveUser(Math.floor(totalElements / size) === page ? totalElements % size : size),
      },
    }),
  stubDpsAdminSearch: ({ totalElements = 1, page = 0, size = 10 }) =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/api/users',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'total-records': `${totalElements}`,
          'page-offset': `${page * size}`,
          'page-limit': `${size}`,
        },
        jsonBody: replicateUser(Math.floor(totalElements / size) === page ? totalElements % size : size),
      },
    }),
  stubDpsGetPrisons: () =>
    getFor({
      urlPath: '/api/agencies/type/INST',
      body: [
        {
          agencyId: 'MDI',
          description: 'Moorland (HMP & YOI)',
          longDescription: 'HMP & YOI MOORLAND',
          agencyType: 'INST',
          active: true,
        },
        {
          agencyId: 'LEI',
          description: 'Leeds (HMP)',
          longDescription: 'HMP LEEDS',
          agencyType: 'INST',
          active: true,
        },
      ],
    }),
  verifyDpsSearch: () =>
    getMatchingRequests({
      method: 'GET',
      urlPathPattern: '/api/users/local-administrator/available',
    }).then((data) => data.body.requests),
  verifyDpsAdminSearch: () =>
    getMatchingRequests({
      method: 'GET',
      urlPathPattern: '/api/users',
    }).then((data) => data.body.requests),
}
