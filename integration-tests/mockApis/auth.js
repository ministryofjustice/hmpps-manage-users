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

const getSignInUrl = () =>
  getMatchingRequests({
    method: 'GET',
    urlPath: '/auth/oauth/authorize',
  }).then((data) => {
    const { requests } = data.body
    const stateValue = requests[requests.length - 1].queryParams.state.values[0]
    return `/sign-in/callback?code=codexxxx&state=${stateValue}`
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
        Location: 'http://localhost:3008/sign-in/callback?code=codexxxx&state=stateyyyy',
      },
      body: '<html><body>Sign in page<h1>Sign in</h1></body></html>',
    },
  })

const signOut = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPath: '/auth/sign-out',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: '<html><body>Sign in page<h1>Sign in</h1></body></html>',
    },
  })

const stubError = () =>
  stubFor({
    request: {
      method: 'GET',
      urlPattern: '/auth/api/authuser/id/[^/]*',
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
        Location: 'http://localhost:3008/sign-in/callback?code=codexxxx&state=stateyyyy',
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

const stubEmail = ({ username = 'ITAG_USER', email, verified = true }) =>
  getFor({
    urlPattern: `/auth/api/user/[^/]*/email\\?unverified=true`,
    body: {
      username,
      email,
      verified,
    },
  })

const stubAuthGetUsername = (enabled = true) =>
  getFor({
    urlPattern: '/auth/api/authuser/id/[^/]*',
    body: {
      userId: '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f',
      username: 'AUTH_ADM',
      email: 'auth_test2@digital.justice.gov.uk',
      enabled,
      locked: false,
      verified: false,
      firstName: 'Auth',
      lastName: 'Adm',
      inactiveReason: 'Left',
    },
  })

const stubAuthGetUserWithEmail = (enabled = true) =>
  getFor({
    urlPattern: '/auth/api/authuser/id/[^/]*',
    body: {
      userId: '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f',
      username: 'AUTH_TEST2@DIGITAL.JUSTICE.GOV.UK',
      email: 'auth_test2@digital.justice.gov.uk',
      enabled,
      locked: false,
      verified: false,
      firstName: 'Auth',
      lastName: 'Adm',
      reason: 'Left',
    },
  })

const stubAuthSearch = ({
  content = [
    {
      userId: '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f',
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
    urlPattern: '/auth/api/authuser/id/.*/groups\\?children=false',
    body: [
      { groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' },
      { groupCode: 'SITE_1_GROUP_2', groupName: 'Site 1 - Group 2' },
    ],
  })

const stubAuthUserRoles = () =>
  getFor({
    urlPattern: '/auth/api/authuser/id/.*/roles',
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

const stubAuthCreateGroup = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/auth/api/groups',
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
      urlPattern: '/auth/api/authuser/id/.*/roles',
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
      urlPattern: '/auth/api/authuser/id/.*/roles/.*',
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

const stubAuthUserEmails = () =>
  stubJson({
    method: 'POST',
    urlPattern: '/auth/api/user/email',
    body: [{ username: 'ITAG_USER0', email: 'dps-user@justice.gov.uk' }],
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
    urlPattern: '/auth/api/authuser/id/[^/]*/email',
  })

const stubDpsUserChangeEmail = () =>
  stubJson({
    method: 'POST',
    urlPattern: '/auth/api/prisonuser/[^/]*/email',
  })

const stubAuthCreateUser = () =>
  stubJson({
    method: 'POST',
    urlPattern: '/auth/api/authuser/create',
    body: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
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
    urlPathPattern: '/auth/api/authuser/id/.*/roles',
  }).then((data) => data.body.requests)

const verifyRemoveRole = () =>
  getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/auth/api/authuser/id/.*/roles/.*',
  }).then((data) => data.body.requests)

const verifyAddGroup = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/auth/api/authuser/id/.*/groups/.*',
  }).then((data) => data.body.requests)

const verifyCreateGroup = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/auth/api/groups',
  }).then((data) => data.body.requests)

const verifyCreateChildGroup = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/auth/api/groups/child',
  }).then((data) => data.body.requests)

const verifyRemoveGroup = () =>
  getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/auth/api/authuser/id/.*/groups/.*',
  }).then((data) => data.body.requests)

const verifyUserEnable = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/auth/api/authuser/id/.*/enable',
  }).then((data) => data.body.requests)

const verifyUserDisable = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/auth/api/authuser/id/.*/disable',
  }).then((data) => data.body.requests)

const verifyAuthUserChangeEmail = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/auth/api/authuser/.*',
  }).then((data) => data.body.requests)

const verifyDpsUserChangeEmail = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/auth/api/prisonuser/[^/]*/email',
  }).then((data) => data.body.requests)

const verifyAuthCreateUser = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/auth/api/authuser/create',
  }).then((data) => data.body.requests)

const stubAllRoles = ({
  content = [
    { roleCode: 'AUTH_GROUP_MANAGER', roleName: 'Auth Group Manager' },
    { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search' },
    { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
  ],
  totalElements = 3,
  page = 0,
  size = 10,
}) =>
  getFor({
    urlPath: '/auth/api/roles',
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

const stubRoleDetails = ({
  content = {
    roleCode: 'AUTH_GROUP_MANAGER',
    roleName: 'Auth Group Manager',
    roleDescription: 'Role to be a Group Manager',
    adminType: [
      {
        adminTypeName: 'External Admin',
        id: '8bdd748f-25cf-4d06-8e55-a6e9aa792b0f',
      },
      {
        adminTypeName: 'External Group Manager',
        id: 'c6d27933-888b-44e1-968c-59ba0edffab1',
      },
    ],
  },
}) =>
  getFor({
    urlPattern: '/auth/api/roles/[^/]*',
    body: content,
  })

const verifyAllRoles = () =>
  getMatchingRequests({
    method: 'GET',
    urlPathPattern: '/auth/api/roles',
  }).then((data) => data.body.requests)

module.exports = {
  getSignInUrl,
  stubSignIn: (username, roles) =>
    Promise.all([
      favicon(),
      redirect(),
      signOut(),
      token(),
      stubUserMe({}),
      stubUserMeRoles(roles),
      stubUser(username),
    ]),
  stubUserMe,
  stubUserMeRoles,
  stubEmail,
  redirect,
  stubAuthGetUsername,
  stubAuthGetUserWithEmail,
  stubAuthUserEmails,
  stubAuthSearch,
  verifyAuthSearch,
  stubAllRoles,
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
  stubAuthCreateGroup,
  stubAuthDeleteChildGroup,
  stubAuthDeleteGroup,
  stubAuthGroupDetailsNoChildren,
  stubAuthSearchableRoles,
  stubAuthUserDisable,
  stubAuthUserEnable,
  stubAuthUserChangeEmail,
  stubDpsUserChangeEmail,
  stubAuthCreateUser,
  stubError,
  stubHealth,
  stubRoleDetails,
  verifyAddRoles,
  verifyRemoveRole,
  verifyAddGroup,
  verifyCreateGroup,
  verifyCreateChildGroup,
  verifyRemoveGroup,
  verifyUserEnable,
  verifyUserDisable,
  verifyAuthUserChangeEmail,
  verifyDpsUserChangeEmail,
  verifyAuthCreateUser,
  verifyAllRoles,
}
