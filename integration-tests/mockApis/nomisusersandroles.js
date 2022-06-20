const { stubFor, getFor, getMatchingRequests, stubJson } = require('./wiremock')

const replicateUser = (times) =>
  [...Array(times).keys()].map((i) => ({
    username: `ITAG_USER${i}`,
    active: i % 2 === 0,
    primaryEmail: `ITAG_USER${i}@gov.uk`,
    email: `ITAG_USER${i}@gov.uk`,
    firstName: 'Itag',
    lastName: `User${i}`,
    activeCaseload: {
      id: 'BXI',
      name: 'Brixton (HMP)',
    },
    dpsRoleCount: i,
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
  stubDpsGetCaseloads: () =>
    getFor({
      urlPath: '/nomisusersandroles/reference-data/caseloads',
      body: [
        {
          id: 'MDI',
          name: 'Moorland (HMP & YOI)',
        },
        {
          id: 'LEI',
          name: 'Leeds (HMP)',
        },
      ],
    }),
  stubGetRoles: ({
    content = [
      {
        code: 'MAINTAIN_ACCESS_ROLES',
        name: 'Maintain Roles',
      },
      {
        code: 'USER_ADMIN',
        name: 'User Admin',
      },
    ],
  }) =>
    getFor({
      urlPath: '/nomisusersandroles/roles',
      body: content,
    }),
  stubGetRolesIncludingAdminRoles: () =>
    getFor({
      urlPattern: '/nomisusersandroles/roles\\?admin-roles=true',
      body: [
        {
          code: 'MAINTAIN_ACCESS_ROLES',
          name: 'Maintain Roles',
          adminRoleOnly: false,
        },
        {
          code: 'USER_ADMIN',
          name: 'User Admin',
          adminRoleOnly: true,
        },
        {
          code: 'ANOTHER_ADMIN_ROLE',
          name: 'Another admin role',
          adminRoleOnly: true,
        },
        {
          code: 'ANOTHER_GENERAL_ROLE',
          name: 'Another general role',
          adminRoleOnly: false,
        },
      ],
    }),
  stubUserDetails: (active = true) =>
    getFor({
      urlPattern: '/nomisusersandroles/users/.*',
      body: {
        staffId: '12345',
        username: 'ITAG_USER',
        firstName: 'Itag',
        lastName: 'User',
        primaryEmail: `ITAG_USER@gov.uk`,
        email: `ITAG_USER@gov.uk`,
        active,
        accountStatus: active ? 'OPEN' : 'LOCKED',
      },
    }),
  stubUserDetailsWithoutEmail: () =>
    getFor({
      urlPattern: '/nomisusersandroles/users/.*',
      body: {
        staffId: '12345',
        username: 'ITAG_USER',
        firstName: 'Itag',
        lastName: 'User',
      },
    }),
  stubDpsUserEnable: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/nomisusersandroles/users/.*/unlock-user',
    }),

  stubDpsUserDisable: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/nomisusersandroles/users/.*/lock-user',
    }),
  stubDpsAddRoles: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/nomisusersandroles/users/.*/roles',
      },
      response: { status: 200 },
    }),
  stubDpsRemoveRole: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/nomisusersandroles/users/.*/roles',
      },
      response: { status: 200 },
    }),
  stubUserCaseloads: (caseloads) =>
    getFor({
      urlPattern: '/nomisusersandroles/users/.*/caseloads',
      body: caseloads || {
        username: 'ITAG_USER',
        activeCaseload: {
          id: 'MDI',
          name: 'Moorland',
        },
        caseloads: [
          {
            id: 'MDI',
            name: 'Moorland',
          },
        ],
      },
    }),
  verifyDpsAddRoles: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/nomisusersandroles/users/.*/roles',
    }).then((data) => data.body.requests),
  verifyDpsRemoveRole: () =>
    getMatchingRequests({
      method: 'DELETE',
      urlPathPattern: '/nomisusersandroles/users/.*/roles/.*',
    }).then((data) => data.body.requests),
  verifyDpsUserEnable: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/nomisusersandroles/users/.*/unlock-user',
    }).then((data) => data.body.requests),

  verifyDpsUserDisable: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/nomisusersandroles/users/.*/lock-user',
    }).then((data) => data.body.requests),
}
