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
    urlPattern: '/roles/.*',
  })

const stubChangeRoleDescription = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/roles/.*/description',
  })

const stubChangeRoleAdminType = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/roles/.*/admintype',
  })

const verifyRoleNameUpdate = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/roles/.*',
  }).then((data) => data.body.requests)

const verifyRoleDescriptionUpdate = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/roles/.*/description',
  }).then((data) => data.body.requests)

const verifyRoleAdminTypeUpdate = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/roles/.*/admintype',
  }).then((data) => data.body.requests)

module.exports = {
  stubHealth,
  stubRoleDetails,
  stubChangeRoleName,
  stubChangeRoleDescription,
  stubChangeRoleAdminType,
  verifyRoleNameUpdate,
  verifyRoleDescriptionUpdate,
  verifyRoleAdminTypeUpdate,
}
