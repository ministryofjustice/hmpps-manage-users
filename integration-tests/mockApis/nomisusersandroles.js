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
    status: i % 2 === 0 ? 'OPEN' : 'LOCKED',
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
  stubUserDetails: ({ accountStatus, active = true, enabled = true, administratorOfUserGroups = null }) =>
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
        enabled,
        accountStatus: accountStatus || (active ? 'OPEN' : 'LOCKED'),
        administratorOfUserGroups,
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
  stubUserDetailsLSA: ({ accountStatus, active = true, enabled = true }) =>
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
        enabled,
        accountStatus: accountStatus || (active ? 'OPEN' : 'LOCKED'),
        activeCaseload: {
          id: 'BXI',
          name: 'Brixton (HMP)',
        },
        administratorOfUserGroups: [
          { id: 'BLM', name: 'Belmarsh (HMP)' },
          { id: 'BXI', name: 'Brixton (HMP)' },
        ],
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
  stubDpsAddUserRoles: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/nomisusersandroles/users/.*/roles',
      },
      response: { status: 200 },
    }),
  stubDpsAddUserCaseloads: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/nomisusersandroles/users/.*/caseloads',
      },
      response: { status: 200 },
    }),
  stubDpsRemoveUserRole: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/nomisusersandroles/users/.*/roles/.*',
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
          {
            id: 'LEI',
            name: 'Leeds (HMP)',
          },
          {
            id: 'PVI',
            name: 'Pentonville (HMP)',
          },
        ],
      },
    }),
  stubDpsRemoveUserCaseload: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/nomisusersandroles/users/.*/caseloads/.*',
      },
      response: { status: 200 },
    }),
  stubDownload: () =>
    getFor({
      urlPattern: '/nomisusersandroles/users/download\\?.*',
      body: [
        {
          username: 'LOCKED_USER',
          staffId: 7,
          firstName: 'User',
          lastName: 'Locked',
          active: false,
          status: 'LOCKED',
          locked: true,
          expired: false,
          activeCaseload: null,
          dpsRoleCount: 0,
          email: null,
        },
        {
          username: 'ITAG_USER',
          staffId: 1,
          firstName: 'Itag',
          lastName: 'User',
          active: true,
          status: 'OPEN',
          locked: false,
          expired: false,
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland Closed (HMP & YOI)',
          },
          dpsRoleCount: 0,
          email: 'multiple.user.test@digital.justice.gov.uk',
        },
      ],
    }),
  stubLSADownload: () =>
    getFor({
      urlPattern: '/nomisusersandroles/users/download/admins\\?.*',
      body: [
        {
          username: 'ITAG_USER',
          staffId: 1,
          firstName: 'Itag',
          lastName: 'User',
          active: true,
          status: 'OPEN',
          locked: false,
          expired: false,
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland Closed (HMP & YOI)',
          },
          dpsRoleCount: 0,
          email: 'multiple.user.test@digital.justice.gov.uk',
          administratorOfUserGroups: [
            { id: 'BXI', name: 'Brixton (HMP)' },
            { id: 'MDI', name: 'Moorland (HMP & YOI)' },
          ],
        },
        {
          username: 'ITAG_USER2',
          staffId: 2,
          firstName: 'Itag2',
          lastName: 'User',
          active: true,
          status: 'OPEN',
          locked: false,
          expired: false,
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland Closed (HMP & YOI)',
          },
          dpsRoleCount: 0,
          email: 'multiple.user.test2@digital.justice.gov.uk',
          administratorOfUserGroups: [{ id: 'MAN', name: 'Manchester (HMP)' }],
        },
      ],
    }),
  verifyDpsAddUserRoles: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/nomisusersandroles/users/.*/roles',
    }).then((data) => data.body.requests),
  verifyDpsRemoveUserRole: () =>
    getMatchingRequests({
      method: 'DELETE',
      urlPathPattern: '/nomisusersandroles/users/.*/roles/.*',
    }).then((data) => data.body.requests),
  verifyDpsAddUserCaseloads: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/nomisusersandroles/users/.*/caseloads',
    }).then((data) => data.body.requests),
  verifyDpsRemoveUserCaseload: () =>
    getMatchingRequests({
      method: 'DELETE',
      urlPathPattern: '/nomisusersandroles/users/.*/caseloads/.*',
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
