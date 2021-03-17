const jwt = require('jsonwebtoken')
const { stubFor, getFor, stubJson, getMatchingRequests } = require('./wiremock')

const createToken = () => {
  const payload = {
    user_name: 'ITAG_USER',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities: ['ROLE_GLOBAL_SEARCH'],
    jti: '83b50a10-cca6-41db-985f-e87efb303ddb',
    client_id: 'dev',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

const getLoginUrl = () =>
  getMatchingRequests({
    method: 'GET',
    urlPath: '/auth/oauth/authorize',
  }).then((data) => {
    const { requests } = data.body
    const stateValue = requests[requests.length - 1].queryParams.state.values[0]
    return `/login/callback?code=codexxxx&state=${stateValue}`
  })

const favicon = () => getFor({ urlPattern: '/favicon.ico' })

const redirect = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/oauth/authorize\\?response_type=code&redirect_uri=.+?&state=.+?&client_id=.+?',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        Location: 'http://localhost:3008/login/callback?code=codexxxx&state=stateyyyy',
      },
      body: '<html><body>Login page<h1>Sign in</h1></body></html>',
    },
  })

const logout = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/auth/logout',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body>Login page<h1>Sign in</h1></body></html>',
    },
  })

const stubError = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/api/authuser/[^/]*',
    },
    response: {
      status: 500,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      body: '<html><body>Error page<h1>Error</h1></body></html>',
    },
  })

const token = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/oauth/token',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        Location: 'http://localhost:3008/login/callback?code=codexxxx&state=stateyyyy',
      },
      jsonBody: {
        access_token: createToken(),
        token_type: 'bearer',
        refresh_token: 'refresh',
        user_name: 'TEST_USER',
        expires_in: 600,
        scope: 'read write',
        internalUser: true,
      },
    },
  })

const stubUser = (username) => {
  const user = username || 'ITAG_USER'
  return getFor({
    urlPattern: `/auth/api/user/${encodeURI(user)}`,
    body: {
      user_name: user,
      staffId: 231232,
      username: user,
      active: true,
      name: `${user} name`,
      authSource: 'nomis',
    },
  })
}

const stubUserMe = ({
  username = 'ITAG_USER',
  firstName = 'JAMES',
  lastName = 'STUART',
  name = 'James Stuart',
  activeCaseLoadId = 'MDI',
}) =>
  getFor({
    urlPattern: '/auth/api/user/me',
    body: { username, firstName, lastName, name, activeCaseLoadId },
  })

const stubUserMeRoles = (roles) => getFor({ urlPattern: '/auth/api/user/me/roles', body: roles })

const stubEmail = ({ username }) =>
  getFor({
    urlPattern: `/auth/api/user/[^/]*/email`,
    body: {
      username,
      email: `${username}@gov.uk`,
    },
  })
const stubMissingEmail = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: `/auth/api/user/[^/]*/email`,
    },
    response: {
      status: 204,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })
const stubAuthGetUsername = (enabled = true) =>
  getFor({
    urlPattern: '/auth/api/authuser/[^/]*',
    body: {
      username: 'AUTH_ADM',
      email: 'auth_test2@digital.justice.gov.uk',
      enabled,
      locked: false,
      verified: false,
      firstName: 'Auth',
      lastName: 'Adm',
    },
  })

const stubAuthGetUserWithEmail = (enabled = true) =>
  getFor({
    urlPattern: '/auth/api/authuser/[^/]*',
    body: {
      username: 'AUTH_TEST2@DIGITAL.JUSTICE.GOV.UK',
      email: 'auth_test2@digital.justice.gov.uk',
      enabled,
      locked: false,
      verified: false,
      firstName: 'Auth',
      lastName: 'Adm',
    },
  })

const stubAuthSearch = ({
  content = [
    {
      username: 'AUTH_ADM',
      email: 'auth_test2@digital.justice.gov.uk',
      enabled: true,
      locked: false,
      verified: false,
      firstName: 'Auth',
      lastName: 'Adm',
    },
  ],
  totalElements = 1,
  page = 0,
  size = 10,
}) =>
  getFor({
    urlPath: '/auth/api/authuser/search',
    body: {
      content,
      pageable: {
        offset: 0,
        pageNumber: page,
        pageSize: size,
      },
      totalElements,
    },
  })

const verifyAuthSearch = () =>
  getMatchingRequests({
    method: 'GET',
    urlPathPattern: '/auth/api/authuser/search',
  }).then((data) => data.body.requests)

const stubAuthEmailSearch = () =>
  getFor({
    urlPath: '/auth/api/authuser/search',
    body: {
      content: [
        {
          username: 'AUTH_ADM',
          email: 'auth_test2@digital.justice.gov.uk',
          enabled: true,
          locked: false,
          verified: false,
          firstName: 'Auth',
          lastName: 'Adm',
        },
        {
          username: 'AUTH_EXPIRED',
          email: 'auth_test2@digital.justice.gov.uk',
          enabled: true,
          locked: false,
          verified: false,
          firstName: 'Auth',
          lastName: 'Expired',
        },
      ],
      pageable: {
        offset: 0,
        pageNumber: 0,
        pageSize: 10,
      },
      totalElements: 2,
    },
  })

const stubAuthUserGroups = () =>
  getFor({
    urlPattern: '/auth/api/authuser/.*/groups\\?children=false',
    body: [
      { groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' },
      { groupCode: 'SITE_1_GROUP_2', groupName: 'Site 1 - Group 2' },
    ],
  })

const stubAuthUserRoles = () =>
  getFor({
    urlPattern: '/auth/api/authuser/.*/roles',
    body: [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search' },
      { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
    ],
  })

const stubAuthAssignableRoles = (body) =>
  getFor({
    urlPattern: '/auth/api/authuser/.*/assignable-roles',
    body: body || [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search' },
      { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
      { roleCode: 'LICENCE_VARY', roleName: 'Licence Vary' },
    ],
  })

const stubAuthAssignableGroups = ({
  content = [
    { groupCode: 'SOC_NORTH_WEST', groupName: 'SOCU North West' },
    { groupCode: 'PECS_TVP', groupName: 'PECS Police Force Thames Valley' },
    { groupCode: 'PECS_SOUTBC', groupName: 'PECS Court Southend Combined Court' },
  ],
}) =>
  getFor({
    urlPattern: '/auth/api/authuser/.*/assignable-groups',
    body: content,
  })

const stubAuthAssignableGroupDetails = ({
  content = {
    groupCode: 'SITE_1_GROUP_2',
    groupName: 'Site 1 - Group 2',
    assignableRoles: [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', automatic: true },
      { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer', automatic: true },
    ],
    children: [{ groupCode: 'CHILD_1', groupName: 'Child - Site 1 - Group 2' }],
  },
}) =>
  getFor({
    urlPattern: '/auth/api/groups/.*',
    body: content,
  })

const stubAuthGroupDetailsNoChildren = ({
  content = {
    groupCode: 'SITE_1_GROUP_2',
    groupName: 'Site 1 - Group 2',
    assignableRoles: [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', automatic: true },
      { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer', automatic: true },
    ],
    children: [],
  },
}) =>
  getFor({
    urlPattern: '/auth/api/groups/.*',
    body: content,
  })

const stubAuthDeleteGroup = () =>
  stubFor({
    request: {
      method: 'DELETE',
      urlPattern: '/auth/api/groups/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubAuthChangeGroupName = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/auth/api/groups/.*',
  })

const stubAuthChangeChildGroupName = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPattern: '/auth/api/groups/child/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubAuthCreateChildGroup = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/api/groups/child',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubAuthDeleteChildGroup = () =>
  stubFor({
    request: {
      method: 'DELETE',
      urlPattern: '/auth/api/groups/child/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubAuthSearchableRoles = ({
  content = [
    { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search' },
    { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
    { roleCode: 'LICENCE_VARY', roleName: 'Licence Vary' },
  ],
}) =>
  getFor({
    urlPattern: '/auth/api/authuser/me/searchable-roles',
    body: content,
  })

const stubAuthAddRoles = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/api/authuser/.*/roles',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubAuthAddGroup = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPattern: '/auth/api/authuser/.*/groups/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubAuthAddGroupGroupManagerCannotMaintainUser = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPattern: '/auth/api/authuser/.*/groups/.*',
    },
    response: {
      status: 403,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        error: 'unable to maintain user',
        error_description: 'Unable to enable user, the user is not within one of your groups',
        field: 'groups',
      },
    },
  })

const stubAuthRemoveRole = () =>
  stubFor({
    request: {
      method: 'DELETE',
      urlPattern: '/auth/api/authuser/.*/roles/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubAuthRemoveGroup = () =>
  stubJson({
    method: 'DELETE',
    urlPattern: '/auth/api/authuser/.*/groups/.*',
  })

const stubAuthGroupManagerRemoveLastGroup = () =>
  stubFor({
    request: {
      method: 'DELETE',
      urlPattern: '/auth/api/authuser/.*/groups/.*',
    },
    response: {
      status: 403,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      jsonBody: {
        error: 'group.lastGroupRestriction',
        error_description: 'Last group restriction, Group Manager not allowed to remove group: SITE_1_GROUP_1',
        field: 'group',
      },
    },
  })

const stubAuthUserDisable = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/auth/api/authuser/.*/disable',
  })

const stubAuthUserEnable = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/auth/api/authuser/.*/enable',
  })

const stubAuthUserChangeEmail = () =>
  stubJson({
    method: 'POST',
    urlPattern: '/auth/api/authuser/.*',
  })

const stubAuthCreateUser = () =>
  stubJson({
    method: 'POST',
    urlPattern: '/auth/api/authuser/create',
  })

const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      url: '/auth/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      fixedDelayMilliseconds: status === 500 ? 3000 : '',
    },
  })

const verifyAddRoles = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/auth/api/authuser/.*/roles',
  }).then((data) => data.body.requests)

const verifyRemoveRole = () =>
  getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/auth/api/authuser/.*/roles/.*',
  }).then((data) => data.body.requests)

const verifyAddGroup = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/auth/api/authuser/.*/groups/.*',
  }).then((data) => data.body.requests)

const verifyRemoveGroup = () =>
  getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/auth/api/authuser/.*/groups/.*',
  }).then((data) => data.body.requests)

const verifyUserEnable = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/auth/api/authuser/.*/enable',
  }).then((data) => data.body.requests)

const verifyUserDisable = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/auth/api/authuser/.*/disable',
  }).then((data) => data.body.requests)

const verifyAuthUserChangeEmail = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/auth/api/authuser/.*',
  }).then((data) => data.body.requests)

const verifyAuthCreateUser = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/auth/api/authuser/create',
  }).then((data) => data.body.requests)

module.exports = {
  getLoginUrl,
  stubLogin: (username, roles) =>
    Promise.all([favicon(), redirect(), logout(), token(), stubUserMe({}), stubUserMeRoles(roles), stubUser(username)]),
  stubUserMe,
  stubUserMeRoles,
  stubEmail,
  stubMissingEmail,
  redirect,
  stubAuthGetUsername,
  stubAuthGetUserWithEmail,
  stubAuthSearch,
  verifyAuthSearch,
  stubAuthEmailSearch,
  stubAuthUserRoles,
  stubAuthUserGroups,
  stubAuthAddRoles,
  stubAuthAddGroup,
  stubAuthAddGroupGroupManagerCannotMaintainUser,
  stubAuthRemoveRole,
  stubAuthRemoveGroup,
  stubAuthGroupManagerRemoveLastGroup,
  stubAuthAssignableRoles,
  stubAuthAssignableGroups,
  stubAuthAssignableGroupDetails,
  stubAuthChangeGroupName,
  stubAuthChangeChildGroupName,
  stubAuthCreateChildGroup,
  stubAuthDeleteChildGroup,
  stubAuthDeleteGroup,
  stubAuthGroupDetailsNoChildren,
  stubAuthSearchableRoles,
  stubAuthUserDisable,
  stubAuthUserEnable,
  stubAuthUserChangeEmail,
  stubAuthCreateUser,
  stubError,
  stubHealth,
  verifyAddRoles,
  verifyRemoveRole,
  verifyAddGroup,
  verifyRemoveGroup,
  verifyUserEnable,
  verifyUserDisable,
  verifyAuthUserChangeEmail,
  verifyAuthCreateUser,
}
