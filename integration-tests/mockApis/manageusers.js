const { getFor, stubJson, getMatchingRequests, stubFor } = require('./wiremock')

const stubAllRoles = ({
  content = [
    {
      roleCode: 'AUTH_GROUP_MANAGER',
      roleName: 'Auth Group Manager',
      roleDescription: 'Group manager',
      adminType: [
        {
          adminTypeCode: 'EXT_ADM',
          adminTypeName: 'External Administrator',
        },
      ],
    },
    {
      roleCode: 'GLOBAL_SEARCH',
      roleName: 'Global Search',
      roleDescription: 'Search for prisoner',
      adminType: [
        {
          adminTypeCode: 'DPS_ADM',
          adminTypeName: 'DPS Central Administrator',
        },
        {
          adminTypeCode: 'EXT_ADM',
          adminTypeName: 'External Administrator',
        },
      ],
    },
    {
      roleCode: 'LICENCE_RO',
      roleName: 'Licence Responsible Officer',
      roleDescription: null,
      adminType: [
        {
          adminTypeCode: 'DPS_ADM',
          adminTypeName: 'DPS Central Administrator',
        },
        {
          adminTypeCode: 'DPS_LSA',
          adminTypeName: 'DPS Local System Administrator',
        },
      ],
    },
  ],
  totalElements = 3,
  page = 0,
  size = 10,
}) =>
  getFor({
    urlPath: '/roles',
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

const stubAuthCreateRole = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/roles',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
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

const verifyAllRoles = () =>
  getMatchingRequests({
    method: 'GET',
    urlPathPattern: '/roles',
  }).then((data) => data.body.requests)

const verifyCreateRole = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/roles',
  }).then((data) => data.body.requests)

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
  stubAllRoles,
  stubAuthCreateRole,
  stubHealth,
  stubChangeRoleName,
  stubChangeRoleDescription,
  stubChangeRoleAdminType,
  stubRoleDetails,
  verifyAllRoles,
  verifyCreateRole,
  verifyRoleNameUpdate,
  verifyRoleDescriptionUpdate,
  verifyRoleAdminTypeUpdate,
}
