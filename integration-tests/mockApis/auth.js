const jwt = require('jsonwebtoken')
const { stubFor, getFor, stubJson, getMatchingRequests } = require('./wiremock')
const { stubUserMeRoles } = require('./manageusers')

const createToken = (tokenRoles) => {
  const authorities = tokenRoles || ['ROLE_GLOBAL_SEARCH']
  const payload = {
    user_name: 'ITAG_USER',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities,
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

const token = (tokenRoles) =>
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
        access_token: createToken(tokenRoles),
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

const stubAuthUserFail = (username) =>
  getFor({
    urlPattern: `/auth/api/authuser/id/${username}`,
    response: {
      body: {
        error: 'Not Found',
        error_description: `Account for username ${username} not found`,
        field: 'username',
      },
    },
    status: 404,
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
const stubAuthUserEmails = () =>
  stubJson({
    method: 'POST',
    urlPattern: '/auth/api/user/email',
    body: [{ username: 'ITAG_USER0', email: 'dps-user@justice.gov.uk' }],
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

const stubSyncDpsEmail = () =>
  stubJson({
    method: 'POST',
    urlPattern: '/auth/api/prisonuser/[^/]*/email/sync',
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

module.exports = {
  getSignInUrl,
  stubSignIn: (username, roles) => {
    let tokenRoles = []
    roles.forEach((role) => tokenRoles.push(`ROLE_${role.roleCode}`))
    if (!Array.isArray(tokenRoles)) {
      tokenRoles = [tokenRoles]
    }

    Promise.all([
      favicon(),
      redirect(),
      signOut(),
      token(tokenRoles),
      stubUserMe({}),
      stubUserMeRoles(roles),
      stubUser(username),
    ])
  },
  stubUserMe,
  stubEmail,
  redirect,
  stubAuthGetUsername,
  stubAuthGetUserWithEmail,
  stubAuthUserEmails,
  stubAuthEmailSearch,
  stubAuthUserChangeEmail,
  stubDpsUserChangeEmail,
  stubSyncDpsEmail,
  stubAuthCreateUser,
  stubAuthUserFail,
  stubError,
  stubHealth,
  verifyAuthUserChangeEmail,
  verifyDpsUserChangeEmail,
  verifyAuthCreateUser,
}
