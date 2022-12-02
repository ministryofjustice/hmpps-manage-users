const { getFor, stubJson, getMatchingRequests, stubFor } = require('./wiremock')

const stubDpsCreateUser = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/users',
    },
    response: {
      status: 200,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      jsonBody: {
        username: 'USER_LAA',
        staffId: 100,
        firstName: 'Firstlaa',
        lastName: 'Lastlaa',
        activeCaseloadId: 'MDI',
        accountStatus: 'EXPIRED',
        accountType: 'ADMIN',
        primaryEmail: 'test.localadminuser@digital.justice.gov.uk',
        dpsRoleCodes: [],
        accountNonLocked: true,
        credentialsNonExpired: false,
        enabled: true,
        admin: true,
        active: false,
      },
    },
  })

const stubAllRolesPaged = ({
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
    urlPath: '/roles/paged',
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

const stubExternalUserRoles = () =>
  getFor({
    urlPattern: '/externalusers/.*/roles',
    body: [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', roleDescription: 'Is allowed to search' },
      { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
    ],
  })

const stubGetRoles = ({
  content = [
    {
      roleCode: 'MAINTAIN_ACCESS_ROLES',
      roleName: 'Maintain Roles',
      roleDescription: 'Maintaining roles for everyone',
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
    {
      roleCode: 'USER_ADMIN',
      roleName: 'User Admin',
      roleDescription: 'Administering users',
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
}) =>
  getFor({
    urlPattern: '/roles\\?adminTypes=DPS_LSA',
    body: content,
  })

const stubGetRolesIncludingAdminRoles = ({
  content = [
    {
      roleCode: 'MAINTAIN_ACCESS_ROLES',
      roleName: 'Maintain Roles',
      roleDescription: 'Maintaining roles for everyone',
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
    {
      roleCode: 'USER_ADMIN',
      roleName: 'User Admin',
      roleDescription: 'Administering users',
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
    {
      roleCode: 'ANOTHER_ADMIN_ROLE',
      roleName: 'Another admin role',
      roleDescription: 'Some text for another Admin Role',
      adminType: [
        {
          adminTypeCode: 'DPS_ADM',
          adminTypeName: 'DPS Central Administrator',
        },
      ],
    },
    {
      roleCode: 'ANOTHER_GENERAL_ROLE',
      roleName: 'Another general role',
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
  ],
}) =>
  getFor({
    urlPattern: '/roles\\?adminTypes=DPS_ADM',
    body: content,
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
    urlPattern: '/roles/(rolecode0|AUTH_GROUP_MANAGER)',
    body: content,
  })

const stubUserAssignableRoles = (body) =>
  getFor({
    urlPattern: '/externalusers/.*/assignable-roles',
    body: body || [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', roleDescription: 'Is allowed to search' },
      { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
      { roleCode: 'LICENCE_VARY', roleName: 'Licence Vary' },
    ],
  })

const stubBannerMessage = () =>
  getFor({
    urlPattern: '/notification/banner/.*',
    body: {
      message: 'Notification banner message',
    },
  })

const stubBannerNoMessage = () =>
  getFor({
    urlPattern: '/notification/banner/.*',
    body: { message: '' },
  })

const stubDPSRoleDetails = ({
  content = {
    roleCode: 'AUTH_GROUP_MANAGER',
    roleName: 'Auth Group Manager',
    roleDescription: 'Role to be a Group Manager',
    adminType: [
      {
        adminTypeName: 'DPS Central Admin',
        adminTypeCode: 'DPS_ADM',
      },
    ],
  },
}) =>
  getFor({
    urlPattern: '/roles/(rolecode0|AUTH_GROUP_MANAGER)',
    body: content,
  })

const stubDpsUserGetRoles = (activeCaseload = true) =>
  getFor({
    urlPattern: '/users/.*/roles',
    body: {
      ...(activeCaseload && {
        activeCaseload: {
          id: 'MDI',
          name: 'Moorland',
        },
      }),
      dpsRoles: [
        {
          code: 'MAINTAIN_ACCESS_ROLES',
          name: 'Maintain Roles',
          adminRoleOnly: false,
        },
        {
          code: 'ANOTHER_GENERAL_ROLE',
          name: 'Another general role',
          adminRoleOnly: false,
        },
      ],
    },
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

const stubChangeRoleAdminTypeFail = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/roles/AUTH_GROUP_MANAGER/admintype',
    status: 404,
    body: {
      status: 404,
      userMessage: 'Unexpected error: Unable to get role: AUTH_GROUP_MANAGER with reason: notfound',
      developerMessage: 'Unable to get role: AUTH_GROUP_MANAGER with reason: notfound',
    },
  })

const stubGroupDetailsWithChildren = ({
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
    urlPattern: '/groups/.*',
    body: content,
  })

const stubGroupDetailsNoChildren = ({
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
    urlPattern: '/groups/.*',
    body: content,
  })

const stubGroupDetailsFail = (groupName) =>
  getFor({
    urlPattern: `/groups/${groupName}`,
    response: {
      body: {
        error: 'Not Found',
        error_description: `Unable to get group: ${groupName} with reason: notfound`,
        field: 'group',
      },
    },
    status: 404,
  })

const stubCreateGroup = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/groups',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubCreateChildGroup = () =>
  stubFor({
    request: {
      method: 'POST',
      urlPattern: '/groups/child',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const verifyDpsCreateUser = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/users',
  }).then((data) => data.body.requests)

const verifyAllRoles = () =>
  getMatchingRequests({
    method: 'GET',
    urlPathPattern: '/roles/paged',
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

const verifyCreateGroup = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/groups',
  }).then((data) => data.body.requests)

const verifyCreateChildGroup = () =>
  getMatchingRequests({
    method: 'POST',
    urlPathPattern: '/groups/child',
  }).then((data) => data.body.requests)

const stubDeleteChildGroup = () =>
  stubFor({
    request: {
      method: 'DELETE',
      urlPattern: '/groups/child/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })
const stubChangeChildGroupName = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPattern: '/groups/child/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })
const stubChangeGroupName = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/groups/.*',
  })
const verifyAddGroup = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/users/.*/groups/.*',
  }).then((data) => data.body.requests)

const verifyRemoveGroup = () =>
  getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/users/.*/groups/.*',
  }).then((data) => data.body.requests)

const stubManageUserGroups = () =>
  getFor({
    urlPattern: '/users/.*/groups\\?children=false',
    body: [
      { groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' },
      { groupCode: 'SITE_1_GROUP_2', groupName: 'Site 1 - Group 2' },
    ],
  })

const stubManageUsersAddGroup = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPattern: '/users/.*/groups/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubManageUsersAddGroupGroupManagerCannotMaintainUser = () =>
  stubFor({
    request: {
      method: 'PUT',
      urlPattern: '/users/.*/groups/.*',
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

const stubManageUsersRemoveRole = () =>
  stubFor({
    request: {
      method: 'DELETE',
      urlPattern: '/externalusers/.*/roles/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })

const stubManageUsersRemoveGroup = () =>
  stubJson({
    method: 'DELETE',
    urlPattern: '/users/.*/groups/.*',
  })

const stubManageUsersGroupManagerRemoveLastGroup = () =>
  stubFor({
    request: {
      method: 'DELETE',
      urlPattern: '/users/.*/groups/.*',
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
const stubManageUsersDeleteGroup = () =>
  stubFor({
    request: {
      method: 'DELETE',
      urlPattern: '/groups/.*',
    },
    response: {
      status: 200,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    },
  })
const stubAuthUserEnable = () =>
  stubJson({
    method: 'PUT',
    urlPattern: '/users/.*/enable',
  })

const verifyUserEnable = () =>
  getMatchingRequests({
    method: 'PUT',
    urlPathPattern: '/users/.*/enable',
  }).then((data) => data.body.requests)

const verifyRemoveRole = () =>
  getMatchingRequests({
    method: 'DELETE',
    urlPathPattern: '/externalusers/.*/roles/.*',
  }).then((data) => data.body.requests)

module.exports = {
  stubDpsCreateUser,
  stubGetRoles,
  stubGetRolesIncludingAdminRoles,
  stubAllRolesPaged,
  stubAuthCreateRole,
  stubCreateGroup,
  stubCreateChildGroup,
  stubGroupDetailsFail,
  stubGroupDetailsNoChildren,
  stubGroupDetailsWithChildren,
  stubHealth,
  stubChangeRoleName,
  stubChangeRoleDescription,
  stubChangeRoleAdminType,
  stubChangeRoleAdminTypeFail,
  stubBannerMessage,
  stubBannerNoMessage,
  stubRoleDetails,
  stubDPSRoleDetails,
  stubDpsUserGetRoles,
  verifyDpsCreateUser,
  verifyAllRoles,
  verifyCreateRole,
  verifyRoleNameUpdate,
  verifyRoleDescriptionUpdate,
  verifyRoleAdminTypeUpdate,
  verifyCreateGroup,
  verifyCreateChildGroup,
  stubExternalUserRoles,
  stubDeleteChildGroup,
  stubChangeChildGroupName,
  stubChangeGroupName,
  verifyAddGroup,
  verifyRemoveGroup,
  stubManageUserGroups,
  stubManageUsersAddGroup,
  stubManageUsersAddGroupGroupManagerCannotMaintainUser,
  stubManageUsersRemoveRole,
  verifyRemoveRole,
  stubManageUsersRemoveGroup,
  stubManageUsersGroupManagerRemoveLastGroup,
  stubManageUsersDeleteGroup,
  stubAuthUserEnable,
  stubUserAssignableRoles,
  verifyUserEnable,
}
