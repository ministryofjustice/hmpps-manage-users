const { getFor, stubJson, getMatchingRequests, stubFor } = require('./wiremock')

module.exports = {
  stubError: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/externalusers/id/[^/]*',
      },
      response: {
        status: 500,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        body: '<html lang="en"><body>Error page<h1>Error</h1></body></html>',
      },
    }),

  stubAuthGetUsername: (enabled = true) =>
    getFor({
      urlPattern: '/externalusers/id/[^/]*',
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
    }),

  stubEmail: ({ username = 'ITAG_USER', email, verified = true }) =>
    getFor({
      urlPattern: `/users/[^/]*/email\\?unverified=true`,
      body: {
        username,
        email,
        verified,
      },
    }),

  stubAuthGetUserWithEmail: (enabled = true) =>
    getFor({
      urlPattern: '/externalusers/id/[^/]*',
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
    }),

  stubAuthUserFail: (username) =>
    getFor({
      urlPattern: `/externalusers/id/${username}`,
      response: {
        body: {
          error: 'Not Found',
          error_description: `Account for username ${username} not found`,
          field: 'username',
        },
      },
      status: 404,
    }),

  stubAuthUserChangeEmail: () =>
    stubJson({
      method: 'POST',
      urlPattern: '/externalusers/[^/]*/email',
    }),

  verifyAuthUserChangeEmail: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/externalusers/[^/]*/email',
    }).then((data) => data.body.requests),

  stubUserMe: ({
    username = 'ITAG_USER',
    firstName = 'JAMES',
    lastName = 'STUART',
    name = 'James Stuart',
    activeCaseLoadId = 'MDI',
  }) =>
    getFor({
      urlPattern: '/users/me',
      body: { username, firstName, lastName, name, activeCaseLoadId },
    }),

  stubUserMeRoles: (roles) => getFor({ urlPattern: '/users/me/roles', body: roles }),

  stubExtSearchableRoles: ({
    content = [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search' },
      { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
      { roleCode: 'LICENCE_VARY', roleName: 'Licence Vary' },
    ],
  }) =>
    getFor({
      urlPattern: '/externalusers/me/searchable-roles',
      body: content,
    }),

  stubExternalUserSearch: ({
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
      urlPath: '/externalusers/search',
      body: {
        content,
        pageable: {
          offset: 0,
          pageNumber: page,
          pageSize: size,
        },
        totalElements,
      },
    }),

  stubSyncDpsEmail: () =>
    stubJson({
      method: 'POST',
      urlPattern: '/prisonusers/[^/]*/email/sync',
    }),

  stubDpsUserChangeEmail: () =>
    stubJson({
      method: 'POST',
      urlPattern: '/prisonusers/[^/]*/email',
    }),

  stubDpsCreateUser: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/prisonusers',
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
    }),

  stubLinkedAdminDpsCreateUser: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/linkedprisonusers/admin',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          staffId: 100,
          firstName: 'Firstlaa',
          lastName: 'Lastlaa',
          status: 'EXPIRED',
          primaryEmail: 'test.localadminuser@digital.justice.gov.uk',
          adminAccount: { username: 'USERNAME' },
        },
      },
    }),

  stubAllRolesPaged: ({
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
    }),

  stubExternalUserRoles: () =>
    getFor({
      urlPattern: '/externalusers/.*/roles',
      body: [
        { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', roleDescription: 'Is allowed to search' },
        { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
      ],
    }),

  stubGetRoles: ({
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
    }),

  stubGetRolesIncludingAdminRoles: ({
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
    }),

  stubHealth: (status = 200) =>
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
    }),

  stubAuthCreateRole: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/roles',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubRoleDetails: ({
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
    }),

  stubUserAssignableRoles: (body) =>
    getFor({
      urlPattern: '/externalusers/.*/assignable-roles',
      body: body || [
        { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', roleDescription: 'Is allowed to search' },
        { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer' },
        { roleCode: 'LICENCE_VARY', roleName: 'Licence Vary' },
      ],
    }),

  stubBannerMessage: () =>
    getFor({
      urlPattern: '/notification/banner/.*',
      body: {
        message: 'Notification banner message',
      },
    }),

  stubBannerNoMessage: () =>
    getFor({
      urlPattern: '/notification/banner/.*',
      body: { message: '' },
    }),

  stubExternalCreateUser: () =>
    stubJson({
      method: 'POST',
      urlPattern: '/externalusers/create',
      body: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
    }),

  stubDPSRoleDetails: ({
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
    }),

  stubDpsUserGetRoles: (activeCaseload = true) =>
    getFor({
      urlPattern: '/prisonusers/.*/roles',
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
    }),

  stubChangeRoleName: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/roles/.*',
    }),

  stubChangeRoleDescription: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/roles/.*/description',
    }),

  stubChangeRoleAdminType: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/roles/.*/admintype',
    }),

  stubChangeRoleAdminTypeFail: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/roles/AUTH_GROUP_MANAGER/admintype',
      status: 404,
      body: {
        status: 404,
        userMessage: 'Unexpected error: Unable to get role: AUTH_GROUP_MANAGER with reason: notfound',
        developerMessage: 'Unable to get role: AUTH_GROUP_MANAGER with reason: notfound',
      },
    }),

  stubGroupDetailsWithChildren: ({
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
    }),

  stubGroupDetailsNoChildren: ({
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
    }),

  stubGroupDetailsFail: (groupName) =>
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
    }),

  stubCreateGroup: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/groups',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubCreateChildGroup: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/groups/child',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  verifyDpsCreateUser: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/prisonusers',
    }).then((data) => data.body.requests),

  verifyLinkedAdminDpsCreateUser: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/linkedprisonusers/admin',
    }).then((data) => data.body.requests),

  verifyExternalCreateUser: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/externalusers/create',
    }).then((data) => data.body.requests),

  verifyAllRoles: () =>
    getMatchingRequests({
      method: 'GET',
      urlPathPattern: '/roles/paged',
    }).then((data) => data.body.requests),

  verifyCreateRole: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/roles',
    }).then((data) => data.body.requests),

  verifyEmailDomainListing: () =>
    getMatchingRequests({
      method: 'GET',
      urlPathPattern: '/email-domains',
    }).then((data) => data.body.requests),

  verifyCreateEmailDomain: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/email-domains',
    }).then((data) => data.body.requests),

  verifyDeleteEmailDomain: () =>
    getMatchingRequests({
      method: 'DELETE',
      urlPathPattern: '/email-domains/.*',
    }).then((data) => data.body.requests),

  verifyRoleNameUpdate: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/roles/.*',
    }).then((data) => data.body.requests),

  verifyRoleDescriptionUpdate: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/roles/.*/description',
    }).then((data) => data.body.requests),

  verifyRoleAdminTypeUpdate: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/roles/.*/admintype',
    }).then((data) => data.body.requests),

  verifyCreateGroup: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/groups',
    }).then((data) => data.body.requests),

  verifyCreateChildGroup: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/groups/child',
    }).then((data) => data.body.requests),

  stubDeleteChildGroup: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/groups/child/.*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubAssignableGroups: ({
    content = [
      { groupCode: 'SOC_NORTH_WEST', groupName: 'SOCU North West' },
      { groupCode: 'PECS_TVP', groupName: 'PECS Police Force Thames Valley' },
      { groupCode: 'PECS_SOUTBC', groupName: 'PECS Court Southend Combined Court' },
      { groupCode: 'SITE_1_GROUP_2', groupName: 'Site 1 - Group 2' },
    ],
  }) =>
    getFor({
      urlPattern: '/externalusers/.*/assignable-groups',
      body: content,
    }),

  stubChangeChildGroupName: () =>
    stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/groups/child/.*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),
  stubChangeGroupName: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/groups/.*',
    }),
  verifyAddGroup: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/externalusers/.*/groups/.*',
    }).then((data) => data.body.requests),

  verifyRemoveGroup: () =>
    getMatchingRequests({
      method: 'DELETE',
      urlPathPattern: '/externalusers/.*/groups/.*',
    }).then((data) => data.body.requests),

  stubManageUserGroups: () =>
    getFor({
      urlPattern: '/externalusers/.*/groups\\?children=false',
      body: [
        { groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' },
        { groupCode: 'SITE_1_GROUP_2', groupName: 'Site 1 - Group 2' },
      ],
    }),

  stubManageUsersAddGroup: () =>
    stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/externalusers/.*/groups/.*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubManageUsersAddGroupGroupManagerCannotMaintainUser: () =>
    stubFor({
      request: {
        method: 'PUT',
        urlPattern: '/externalusers/.*/groups/.*',
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
    }),

  stubExternalUserAddRoles: () =>
    stubFor({
      request: {
        method: 'POST',
        urlPattern: '/externalusers/.*/roles',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubManageUsersRemoveRole: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/externalusers/.*/roles/.*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubManageUsersRemoveGroup: () =>
    stubJson({
      method: 'DELETE',
      urlPattern: '/externalusers/.*/groups/.*',
    }),

  stubManageUsersGroupManagerRemoveLastGroup: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/externalusers/.*/groups/.*',
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
    }),

  stubManageUsersDeleteGroup: () =>
    stubFor({
      request: {
        method: 'DELETE',
        urlPattern: '/groups/.*',
      },
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      },
    }),

  stubExternalUserEnable: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/externalusers/.*/enable',
    }),
  stubExternalUserDisable: () =>
    stubJson({
      method: 'PUT',
      urlPattern: '/externalusers/.*/disable',
    }),

  stubAllEmailDomains: ({
    content = [
      {
        id: 'cb5d9f0c-b7c8-40d5-8626-2e97f66d5127',
        domain: 'DOMAIN1',
        description: 'DOMAIN 1 DESCRIPTION',
      },
      {
        id: 'acf5e424-2f7c-4bea-ac1e-07d2553f3e63',
        domain: 'DOMAIN2',
        description: 'DOMAIN 2 DESCRIPTION',
      },
      {
        id: '8529edfa-6bcf-462f-ae29-5433a615d405',
        domain: 'DOMAIN3',
        description: 'DOMAIN 3 DESCRIPTION',
      },
    ],
  }) =>
    getFor({
      urlPath: '/email-domains',
      body: content,
    }),

  verifyExternalUserSearch: () =>
    getMatchingRequests({
      method: 'GET',
      urlPathPattern: '/externalusers/search',
    }).then((data) => data.body.requests),

  verifyExternalUserEnable: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/externalusers/.*/enable',
    }).then((data) => data.body.requests),

  verifyExternalUserDisable: () =>
    getMatchingRequests({
      method: 'PUT',
      urlPathPattern: '/externalusers/.*/disable',
    }).then((data) => data.body.requests),

  verifyAddRoles: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/externalusers/.*/roles',
    }).then((data) => data.body.requests),

  verifyRemoveRole: () =>
    getMatchingRequests({
      method: 'DELETE',
      urlPathPattern: '/externalusers/.*/roles/.*',
    }).then((data) => data.body.requests),

  verifyDpsUserChangeEmail: () =>
    getMatchingRequests({
      method: 'POST',
      urlPathPattern: '/prisonusers/[^/]*/email',
    }).then((data) => data.body.requests),
}
