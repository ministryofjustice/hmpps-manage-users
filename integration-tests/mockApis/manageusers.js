const { getFor, stubJson, getMatchingRequests, stubFor } = require('./wiremock')

const stubHealth = (status = 200) =>
  stubFor({
    request: {
      method: 'GET',
      url: '/health/ping',
    },
    response: {
      status,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      fixedDelayMilliseconds: status === 500 ? 3000 : '',
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
        adminTypeCode: 'EXT_ADM',
      },
    ],
  },
}) =>
  getFor({
    urlPattern: '/roles/[^/]*',
    body: content,
  })

const stubChangeRoleName = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/api/roles/.*',
  })

const verifyRoleNameUpdate = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/api/roles/.*',
  }).then((data) => data.body.requests)

module.exports = {
  stubHealth,
  stubRoleDetails,
  stubChangeRoleName,
  verifyRoleNameUpdate,
}
