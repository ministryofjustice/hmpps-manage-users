const { stubFor, getMatchingRequests } = require('./wiremock')

const replicateUser = (times) =>
  [...Array(times).keys()].map((i) => ({
    username: `ITAG_USER${i}`,
    active: i % 2 === 0,
    firstName: 'Itag',
    lastName: `User${i}`,
    activeCaseload: {
      id: 'BXI',
      name: 'Brixton (HMP)',
    },
  }))

module.exports = {
  stubDpsFindUsers: ({ totalElements = 1, page = 0, size = 10 }) =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/nomisusersandroles/users',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          content: replicateUser(Math.floor(totalElements / size) === page ? totalElements % size : size),
          size,
          totalElements,
          number: page,
          numberOfElements: totalElements < size ? totalElements : size,
        },
      },
    }),
  verifyDpsFindUsers: () =>
    getMatchingRequests({
      method: 'GET',
      urlPathPattern: '/nomisusersandroles/users',
    }).then((data) => data.body.requests),
  stubHealth: (status = 200) => {
    return stubFor({
      request: {
        method: 'GET',
        urlPattern: '/nomisusersandroles/health/ping',
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
}
