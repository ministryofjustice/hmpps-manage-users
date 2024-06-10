const { stubFor, getFor, getMatchingRequests, stubJson } = require('./wiremock')

const replicateUser = (times) =>
  [...Array(times).keys()].map((i) => ({
    username: `ITAG_USER${i}`,
    staffId: i,
    firstName: 'Itag',
    lastName: `User${i}`,
    active: i % 2 === 0,
    status: i % 2 === 0 ? 'OPEN' : 'LOCKED',
    locked: false,
    expired: false,
    activeCaseload: {
      id: 'BXI',
      name: 'Brixton (HMP)',
    },
    dpsRoleCount: i,
    email: `ITAG_USER${i}@gov.uk`,
    staffStatus: 'ACTIVE',
  }))

module.exports = {
  stubDpsFindUsers: ({ totalElements = 1, page = 0, size = 10 }) =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: '/prisonusers/search',
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
      urlPathPattern: '/prisonusers/search',
    }).then((data) => data.body.requests),
  stubDpsGetCaseloads: () =>
    getFor({
      urlPath: '/prisonusers/reference-data/caseloads',
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
  stubUserDetails: ({ accountStatus = 'OPEN', active = true, enabled = true, administratorOfUserGroups = null }) =>
    getFor({
      urlPattern: '/prisonusers/.*/details',
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
      urlPattern: '/prisonusers/.*/details',
      body: {
        staffId: '12345',
        username: 'ITAG_USER',
        firstName: 'Itag',
        lastName: 'User',
      },
    }),
  stubUserDetailsLSA: ({ accountStatus, active = true, enabled = true }) =>
    getFor({
      urlPattern: '/prisonusers/.*/details',
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
      urlPattern: '/prisonusers/.*/enable-user',
    }),
  stubDpsUserDisable: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/prisonusers/.*/disable-user',
    }),
  stubDpsAddUserRoles: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/prisonusers/.*/roles',
      },
      response: { status: 200 },
    }),
  stubDpsAddUserCaseloads: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/prisonusers/.*/caseloads',
      },
      response: { status: 200 },
    }),
  stubDpsRemoveUserRole: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/prisonusers/.*/roles/.*',
      },
      response: { status: 200 },
    }),
  stubUserCaseloads: (caseloads) =>
    getFor({
      urlPattern: '/prisonusers/.*/caseloads',
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
        urlPattern: '/prisonusers/.*/caseloads/.*',
      },
      response: { status: 200 },
    }),
  stubDownload: () =>
    getFor({
      urlPattern: '/prisonusers/download\\?.*',
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
      urlPattern: '/prisonusers/download/admins\\?.*',
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
      urlPathPattern: '/prisonusers/.*/roles',
    }).then((data) => data.body.requests),
  verifyDpsRemoveUserRole: () =>
    getMatchingRequests({
      method: 'DELETE',
      urlPathPattern: '/prisonusers/.*/roles/.*',
    }).then((data) => data.body.requests),
  verifyDpsAddUserCaseloads: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/prisonusers/.*/caseloads',
    }).then((data) => data.body.requests),
  verifyDpsRemoveUserCaseload: () =>
    getMatchingRequests({
      method: 'DELETE',
      urlPathPattern: '/prisonusers/.*/caseloads/.*',
    }).then((data) => data.body.requests),
  verifyDpsUserEnable: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/prisonusers/.*/enable-user',
    }).then((data) => data.body.requests),
  verifyDpsUserDisable: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/prisonusers/.*/disable-user',
    }).then((data) => data.body.requests),
}
