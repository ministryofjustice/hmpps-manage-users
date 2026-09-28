import type { SuperAgentRequest } from 'superagent'
import {
  BulkUserRoleAdditionsJobDetails,
  BulkUserRoleAdditionsJobSummary,
  BulkUserRoleAdditionsRequest,
  ChildGroup,
  EmailDomain,
  ExternalUser,
  Group,
  PrisonUserGroupDetail,
  Role,
  RoleDetail,
  UpdateGroupNameRequest,
  UpdateRoleAdminTypeRequest,
  UpdateRoleDescriptionRequest,
  UpdateRoleNameRequest,
  UserAllowlistDetail,
  UserAllowlistPatchRequest,
  UserCaseloadDetail,
  UserGroup,
  UserRole,
} from 'manageUsersApiClient'
import { stubFor, stubJson, stubPing } from './wiremock'
import { UserTypeKey } from '../../server/presentation/userType'
import { HttpStatusCode } from '../../server/utils/utils'

const manageUsersApiCreateLinkedUrlMap = new Map<UserTypeKey, string>([
  ['DPS_ADM', 'linkedprisonusers/admin'],
  ['DPS_GEN', 'linkedprisonusers/general'],
  ['DPS_LSA', 'linkedprisonusers/lsa'],
])

const defaultImsHiddenRoles: Role[] = [
  {
    roleCode: 'IMS_USER',
    roleName: 'IMS user',
    roleDescription: 'IMS user',
    adminType: [
      {
        adminTypeCode: 'IMS_HIDDEN',
        adminTypeName: 'IMS Administrator',
      },
    ],
  },
]

const defaultDpsAdminRoles: Role[] = [
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
  {
    roleCode: 'OAUTH_ADMIN',
    roleName: 'Oauth Admin',
    roleDescription: 'Some text for oauth admin',
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
]

const defaultLsaRoles: Role[] = [
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
]

const replicateUser = (times: number) =>
  [...Array(times).keys()].map(i => ({
    username: `ITAG_USER${i}`,
    staffId: i,
    firstName: 'Itag',
    lastName: `User${i}`,
    active: i % 2 === 0,
    status: i % 2 === 0 ? 'OPEN' : 'LOCKED',
    locked: false,
    expired: false,
    lastLogonDate: '2023-12-25T12:57:50',
    activeCaseload: {
      id: 'BXI',
      name: 'Brixton (HMP)',
    },
    dpsRoleCount: i,
    email: `ITAG_USER${i}@gov.uk`,
    staffStatus: 'ACTIVE',
  }))

function replicateExternalUser(times: number): ExternalUser[] {
  return [...Array(times).keys()].map(i => ({
    userId: `2e285ccd-dcfd-4497-9e28-d6e8e10a2d${String(i).padStart(3, '0')}`,
    username: `AUTH_USER${i}`,
    email: `auth_user${i}@digital.justice.gov.uk`,
    firstName: 'Auth',
    lastName: `User${i}`,
    enabled: i % 2 === 0,
    locked: i % 2 !== 0,
    verified: i % 2 === 0,
    active: i % 2 === 0,
    inactiveReason: i % 2 === 0 ? undefined : 'Retired',
    lastLoggedIn: '2025-10-15T10:01:58.614221',
  }))
}

const replicateAllowlistUser = (times: number): UserAllowlistDetail[] =>
  [...Array(times).keys()].map(i => ({
    id: `a073bfc1-2f81-4b6d-9b9c-fd7c367f${i.toString(16).padStart(4, '0')}`,
    username: `ALLOW_USER${i}`,
    email: `allow_user${i}@justice.gov.uk`,
    firstName: 'Allow',
    lastName: `User${i}`,
    reason: 'For testing purposes',
    accessPeriod: 'ONE_MONTH',
    createdOn: '2024-03-19T04:39:08',
    allowlistEndDate: '2027-04-19',
    lastUpdated: '2024-03-19T04:39:08',
    lastUpdatedBy: 'ADMIN',
    approver: 'Sharlotte Muirhead',
  }))

// Alternate having 1, 2, or 3 admin types
const generateAdminTypes = (i: number) => {
  const types = []
  types.push({
    adminTypeCode: 'EXT_ADM',
    adminTypeName: 'External Administrator',
  })
  if (i % 3 === 1) {
    types.push({
      adminTypeCode: 'DPS_ADM',
      adminTypeName: 'DPS Central Administrator',
    })
  }
  if (i % 3 === 2) {
    types.push({
      adminTypeCode: 'DPS_ADM',
      adminTypeName: 'DPS Central Administrator',
    })
    types.push({
      adminTypeCode: 'DPS_LSA',
      adminTypeName: 'DPS Local System Administrator',
    })
  }
  return types
}

const replicateRoles = (times: number) =>
  [...Array(times).keys()].map(i => ({
    roleName: `Role Name ${i}`,
    roleCode: `ROLE_CODE_${i}`,
    roleDescription: `Role Description ${i}`,
    adminType: generateAdminTypes(i),
  }))

const stubDpsRoles = (adminTypes: string, body: Role[] = defaultDpsAdminRoles): SuperAgentRequest =>
  stubJson({
    urlPattern: `/manage-users-api/roles\\?adminTypes=${adminTypes}`,
    body,
  })

const stubGetDpsUser = ({
  username = 'ITAG_USER5',
  firstName = 'Itag',
  lastName = 'User',
  email = 'ITAG_USER@gov.uk',
  active = true,
  enabled = true,
  administratorOfUserGroups,
  accountStatus = 'OPEN',
}: {
  username?: string
  firstName?: string
  lastName?: string
  email?: string
  active?: boolean
  enabled?: boolean
  administratorOfUserGroups?: PrisonUserGroupDetail[]
  accountStatus?: string
}): SuperAgentRequest =>
  stubJson({
    urlPattern: `/manage-users-api/prisonusers/${username}/details`,
    body: {
      staffId: '12345',
      username,
      firstName,
      lastName,
      primaryEmail: email,
      email,
      lastLogonDate: '2023-12-25T12:57:50',
      active,
      enabled,
      accountStatus,
      administratorOfUserGroups,
    },
  })

const stubLsaDpsRoles = () => {
  return stubDpsRoles('DPS_LSA', defaultLsaRoles)
}

const stubCentralAdminDpsRoles = () => {
  return stubDpsRoles('DPS_ADM', defaultDpsAdminRoles)
}

const stubOAuthAdminDpsRoles = () => {
  return stubDpsRoles('DPS_ADM', [
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
      roleCode: 'OAUTH_ADMIN',
      roleName: 'Oauth Admin',
      roleDescription: 'Some text for oauth admin',
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
  ])
}

export default {
  stubPing: (httpStatus = HttpStatusCode.OK): SuperAgentRequest => stubPing('/manage-users-api', httpStatus),

  stubNotificationBannerMessage: (notificationType: string, message: string): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/notification/banner/${notificationType}`,
      body: { message },
    }),

  stubGetCaseloads: (): SuperAgentRequest =>
    stubJson({
      urlPattern: '/manage-users-api/prisonusers/reference-data/caseloads',
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

  stubCreateDpsUser: (
    username: string,
    firstName: string,
    lastName: string,
    email: string,
    caseloadId: string,
  ): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: '/manage-users-api/prisonusers',
      body: {
        username,
        staffId: 100,
        firstName,
        lastName,
        activeCaseloadId: caseloadId,
        accountStatus: 'EXPIRED',
        accountType: 'ADMIN',
        primaryEmail: email,
        dpsRoleCodes: [],
        accountNonLocked: true,
        credentialsNonExpired: false,
        enabled: true,
        admin: true,
        active: false,
      },
    }),

  stubCreateDpsUser400Response: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      status: HttpStatusCode.BAD_REQUEST,
      urlPattern: '/manage-users-api/prisonusers',
      body: {
        userMessage: 'Bad request',
      },
    }),

  stubCreateDpsUserAlreadyExists: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      status: HttpStatusCode.CONFLICT,
      urlPattern: '/manage-users-api/prisonusers',
      body: {
        errorCode: 601,
      },
    }),

  stubCreateDpsUserInvalidEmailDomain: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      status: HttpStatusCode.CONFLICT,
      urlPattern: '/manage-users-api/prisonusers',
      body: {
        errorCode: 602,
      },
    }),

  stubGetDpsUser,
  stubGetDpsUserNotFound: (username: string = 'ITAG_USER5'): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/prisonusers/${username}/details`,
      status: HttpStatusCode.NOT_FOUND,
      body: {},
    }),

  stubGetDpsUser400Response: (username: string = 'ITAG_USER5'): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/prisonusers/${username}/details`,
      status: HttpStatusCode.BAD_REQUEST,
      body: {
        userMessage: 'Bad request',
      },
    }),

  stubCreateLinkedDpsUser: (
    userType: UserTypeKey,
    username: string = 'TUSER_GEN',
    firstName: string = 'Test',
    lastName: string = 'User',
    email: string = 'test.user@djustice.gov.uk',
  ): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: `/manage-users-api/${manageUsersApiCreateLinkedUrlMap.get(userType)}`,
      body: {
        staffId: 100,
        firstName,
        lastName,
        status: 'ACTIVE',
        primaryEmail: email,
        [`${userType === 'DPS_GEN' ? 'generalAccount' : 'adminAccount'}`]: { username },
      },
    }),

  stubCreateLinkedDpsUser400Response: (userType: UserTypeKey): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      status: HttpStatusCode.BAD_REQUEST,
      urlPattern: `/manage-users-api/${manageUsersApiCreateLinkedUrlMap.get(userType)}`,
      body: {
        userMessage: 'Bad request',
      },
    }),

  stubCreateLinkedDpsUser409Response: (
    userType: UserTypeKey,
    userMessage: string = 'User already exists',
  ): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      status: HttpStatusCode.CONFLICT,
      urlPattern: `/manage-users-api/${manageUsersApiCreateLinkedUrlMap.get(userType)}`,
      body: {
        userMessage,
      },
    }),

  stubCreateLinkedDpsUser404Response: (userType: UserTypeKey): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      status: HttpStatusCode.NOT_FOUND,
      urlPattern: `/manage-users-api/${manageUsersApiCreateLinkedUrlMap.get(userType)}`,
      body: {},
    }),

  stubDpsRoles,

  stubLsaDpsRoles,

  stubCentralAdminDpsRoles,

  stubOAuthAdminDpsRoles,

  stubDpsUserRoles: ({
    activeCaseload = true,
    dpsRoles = [
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
  }: {
    activeCaseload?: boolean
    dpsRoles?: RoleDetail[]
  }): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/prisonusers/.*/roles`,
      body: {
        ...(activeCaseload && {
          activeCaseload: {
            id: 'MDI',
            name: 'Moorland',
          },
        }),
        dpsRoles,
      },
    }),

  stubDpsAddUserRoles: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: `/manage-users-api/prisonusers/.*/roles`,
      body: {},
    }),

  stubDpsRemoveUserRole: (): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      urlPattern: `/manage-users-api/prisonusers/.*/roles/.*`,
    }),

  stubDpsUserCaseloads: ({
    userCaseloadDetail,
    username = 'ITAG_USER5',
  }: {
    userCaseloadDetail?: UserCaseloadDetail
    username?: string
  }): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/prisonusers/${username}/caseloads`,
      body: userCaseloadDetail || {
        username,
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

  stubDpsRemoveUserCaseload: (): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      urlPattern: '/manage-users-api/prisonusers/.*/caseloads/.*',
    }),

  stubDpsAddUserCaseload: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: '/manage-users-api/prisonusers/.*/caseloads',
    }),

  stubEmail: ({
    username = 'ITAG_USER5',
    email,
    verified = true,
  }: {
    username?: string
    email: string
    verified?: boolean
  }): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/users/[^/]*/email\\?unverified=true`,
      body: {
        username,
        email,
        verified,
      },
    }),

  stubRestrictedRolesMiddleware: ({
    username = 'USER1',
    isLocalAdmin = false,
  }: {
    username?: string
    isLocalAdmin?: boolean
  }) => {
    return Promise.all([
      stubDpsRoles('IMS_HIDDEN', defaultImsHiddenRoles),
      stubCentralAdminDpsRoles(),
      stubLsaDpsRoles(),
      stubGetDpsUser({
        username,
        administratorOfUserGroups: isLocalAdmin
          ? [
              { id: 'BLM', name: 'Belmarsh (HMP)' },
              { id: 'BXI', name: 'Brixton (HMP)' },
            ]
          : [],
      }),
    ])
  },

  stubSearchDpsUsers: ({ totalElements = 1, page = 0, size = 10 }): SuperAgentRequest =>
    stubJson({
      urlPath: '/manage-users-api/prisonusers/search',
      body: {
        content: replicateUser(Math.floor(totalElements / size) === page ? totalElements % size : size),
        size,
        totalElements,
        number: page,
        numberOfElements: totalElements < size ? totalElements : size,
      },
    }),

  stubDpsUsersDownload: (): SuperAgentRequest =>
    stubJson({
      urlPattern: '/manage-users-api/prisonusers/download\\?.*',
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

  stubDpsLsaDownload: (): SuperAgentRequest =>
    stubJson({
      urlPattern: '/manage-users-api/prisonusers/download/admins\\?.*',
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

  stubSyncDpsEmail: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: '/manage-users-api/prisonusers/[^/]*/email/sync',
      body: undefined,
    }),

  stubDpsUserChangeEmail: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: '/manage-users-api/prisonusers/[^/]*/email',
    }),

  stubDpsUserChangeEmailInvalidDomain: (): SuperAgentRequest =>
    stubJson({
      status: HttpStatusCode.BAD_REQUEST,
      method: 'POST',
      urlPattern: '/manage-users-api/prisonusers/[^/]*/email',
      body: {
        developerMessage: 'Validate email failed with reason: domain',
      },
    }),

  stubDpsUserChangeEmailAlreadyAssigned: (): SuperAgentRequest =>
    stubJson({
      status: HttpStatusCode.BAD_REQUEST,
      method: 'POST',
      urlPattern: '/manage-users-api/prisonusers/[^/]*/email',
      body: {
        developerMessage: 'Validate email failed with reason: duplicate',
      },
    }),

  stubDpsUserEnable: (): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPattern: '/manage-users-api/prisonusers/.*/enable-user',
    }),

  stubDpsUserDisable: (): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPattern: '/manage-users-api/prisonusers/.*/disable-user',
    }),

  stubGetAllEmailDomains: (emailDomains?: EmailDomain[]): SuperAgentRequest =>
    stubJson({
      urlPath: '/manage-users-api/email-domains',
      body: emailDomains || [
        {
          id: 'cb5d9f0c-b7c8-40d5-8626-2e97f66d5127',
          domain: 'test.justice.gov.uk',
          description: 'Test justice domain',
        },
        {
          id: 'acf5e424-2f7c-4bea-ac1e-07d2553f3e63',
          domain: 'test.police.uk',
          description: 'Test police domain',
        },
        {
          id: '8529edfa-6bcf-462f-ae29-5433a615d405',
          domain: 'test.external.com',
          description: 'Test external domain',
        },
      ],
    }),

  stubGetEmailDomain: (id: string): SuperAgentRequest =>
    stubJson({
      urlPath: `/manage-users-api/email-domains/${id}`,
      body: {
        id,
        domain: 'test.justice.gov.uk',
        description: 'Test justice domain',
      },
    }),

  stubGetEmailDomainBadRequest: (id: string): SuperAgentRequest =>
    stubJson({
      status: HttpStatusCode.BAD_REQUEST,
      urlPath: `/manage-users-api/email-domains/${id}`,
    }),

  stubGetEmailDomainNotFound: (id: string): SuperAgentRequest =>
    stubJson({
      status: HttpStatusCode.NOT_FOUND,
      urlPath: `/manage-users-api/email-domains/${id}`,
    }),

  stubCreateEmailDomain: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPath: `/manage-users-api/email-domains`,
      body: {
        id: 'cb5d9f0c-b7c8-40d5-8626-2e97f66d5127',
        domain: 'test.justice.gov.uk',
        description: 'Test justice domain',
      },
    }),

  stubDeleteEmailDomain: (id: string): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      urlPath: `/manage-users-api/email-domains/${id}`,
    }),

  stubCreateGroup: (status: HttpStatusCode = HttpStatusCode.OK): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPath: `/manage-users-api/groups`,
      status,
    }),

  stubGroupDetails: (group: Group): SuperAgentRequest =>
    stubJson({
      method: 'GET',
      urlPath: `/manage-users-api/groups/${group.groupCode}`,
      body: group,
    }),

  stubAssignableGroups: (
    assignableGroups: UserGroup[] = [
      { groupCode: 'SOC_NORTH_WEST', groupName: 'SOCU North West' },
      { groupCode: 'PECS_TVP', groupName: 'PECS Police Force Thames Valley' },
      { groupCode: 'PECS_SOUTBC', groupName: 'PECS Court Southend Combined Court' },
      { groupCode: 'SITE_1_GROUP_2', groupName: 'Site 1 - Group 2' },
    ],
  ): SuperAgentRequest =>
    stubJson({
      method: 'GET',
      urlPath: `/manage-users-api/externalusers/me/assignable-groups`,
      body: assignableGroups,
    }),

  stubChangeGroupName: (groupCode: string, body: UpdateGroupNameRequest): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPath: `/manage-users-api/groups/${groupCode}`,
      body,
    }),

  stubChildGroupDetails: (group: ChildGroup): SuperAgentRequest =>
    stubJson({
      method: 'GET',
      urlPath: `/manage-users-api/groups/child/${group.groupCode}`,
      body: group,
    }),

  stubChangeChildGroupName: (groupCode: string, body: UpdateGroupNameRequest): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPath: `/manage-users-api/groups/child/${groupCode}`,
      body,
    }),

  stubDeleteGroup: (group: string): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      urlPath: `/manage-users-api/groups/${group}`,
    }),

  stubDeleteChildGroup: (group: string): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      urlPath: `/manage-users-api/groups/child/${group}`,
    }),

  stubCreateRole: (status: HttpStatusCode = HttpStatusCode.OK): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPath: `/manage-users-api/roles`,
      status,
    }),

  stubRoleDetails: (role: Role): SuperAgentRequest =>
    stubJson({
      method: 'GET',
      urlPath: `/manage-users-api/roles/${role.roleCode}`,
      body: role,
    }),

  stubPagedRoles: ({
    totalElements = 1,
    page = 0,
    size = 10,
    content = replicateRoles(Math.floor(totalElements / size) === page ? totalElements % size : size),
  }): SuperAgentRequest =>
    stubJson({
      urlPath: '/manage-users-api/roles/paged',
      body: {
        content,
        size,
        totalElements,
        number: page,
        numberOfElements: totalElements < size ? totalElements : size,
      },
    }),

  stubChangeRoleName: (roleCode: string, body: UpdateRoleNameRequest): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPath: `/manage-users-api/roles/${roleCode}`,
      body,
    }),

  stubChangeRoleDescription: (roleCode: string, body: UpdateRoleDescriptionRequest): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPath: `/manage-users-api/roles/${roleCode}/description`,
      body,
    }),

  stubChangeRoleAdminType: (roleCode: string, body: UpdateRoleAdminTypeRequest): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPath: `/manage-users-api/roles/${roleCode}/admintype`,
      body,
    }),

  stubGetAllCRSGroups: ({
    crsGroups = [
      { groupCode: 'INT_CR_PRJ_6166', groupName: 'CRS Accommodation for South Wales' },
      { groupCode: 'INT_CR_PRJ_6158', groupName: 'CRS Accommodation Services - Dyfed-Powys' },
      { groupCode: 'INT_CR_PRJ_5549', groupName: 'CRS Accommodation Services - East Midlands' },
    ],
  }): SuperAgentRequest =>
    stubJson({
      urlPattern: '/manage-users-api/groups/subset/crs',
      body: crsGroups,
    }),

  stubGetUsersInCRSGroup: ({
    users = [
      {
        userId: '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f',
        username: 'AUTH_ADM',
        email: 'auth_test2@digital.justice.gov.uk',
        enabled: true,
        locked: false,
        verified: false,
        firstName: 'Auth',
        lastName: 'Adm',
        lastLoggedIn: '2025-10-15T10:01:58.614221',
        inactiveReason: 'Retired',
      },
    ],
  }: {
    users?: ExternalUser[]
  }): SuperAgentRequest =>
    stubJson({
      urlPattern: '/manage-users-api/externalusers/crsgroup/.*',
      body: users,
    }),

  stubCreateExternalUser: (status: HttpStatusCode = HttpStatusCode.OK): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'POST',
        urlPath: '/manage-users-api/externalusers/create',
      },
      response: {
        status,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f',
      },
    }),

  stubSearchExternalUsers: ({
    totalElements = 1,
    page = 0,
    size = 20,
    content,
  }: {
    totalElements?: number
    page?: number
    size?: number
    content?: ExternalUser[]
  } = {}): SuperAgentRequest =>
    stubJson({
      urlPath: '/manage-users-api/externalusers/search',
      body: {
        content:
          content ?? replicateExternalUser(Math.floor(totalElements / size) === page ? totalElements % size : size),
        size,
        totalElements,
        number: page,
        numberOfElements: totalElements < size ? totalElements : size,
      },
    }),

  stubGetExternalUser: ({
    userId = '2e285ccd-dcfd-4497-9e28-d6e8e10a2d3f',
    username = 'AUTH_ADM',
    email = 'auth_test2@digital.justice.gov.uk',
    firstName = 'Auth',
    lastName = 'Adm',
    enabled = true,
    locked = false,
    verified = true,
    active = true,
    inactiveReason,
    lastLoggedIn = '2023-10-15T10:01:58.614221',
  }: {
    userId?: string
    username?: string
    email?: string
    firstName?: string
    lastName?: string
    enabled?: boolean
    locked?: boolean
    verified?: boolean
    active?: boolean
    inactiveReason?: string
    lastLoggedIn?: string
  } = {}): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/externalusers/id/${userId}`,
      body: {
        userId,
        username,
        email,
        firstName,
        lastName,
        enabled,
        locked,
        verified,
        active,
        inactiveReason,
        lastLoggedIn,
      },
    }),

  stubExternalUserRoles: (
    roles: UserRole[] = [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', roleDescription: 'Is allowed to search' },
      { roleCode: 'LICENCE_RO', roleName: 'Licence Responsible Officer', roleDescription: 'Responsible license' },
    ],
  ): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/externalusers/.*/roles`,
      body: roles,
    }),

  stubExternalUserAssignableRoles: (
    roles: UserRole[] = [
      { roleCode: 'LICENCE_VARY', roleName: 'Licence Vary', roleDescription: 'Vary a license' },
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', roleDescription: 'Is allowed to search' },
    ],
  ): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/externalusers/.*/assignable-roles`,
      body: roles,
    }),

  stubUserGroups: (
    groups: UserGroup[] = [
      { groupCode: 'SITE_1_GROUP_1', groupName: 'Site 1 - Group 1' },
      { groupCode: 'SITE_1_GROUP_2', groupName: 'Site 1 - Group 2' },
    ],
  ): SuperAgentRequest =>
    stubJson({
      urlPattern: `/manage-users-api/externalusers/.*/groups\\?.*`,
      body: groups,
    }),

  stubSearchableRoles: (
    roles: UserRole[] = [
      { roleCode: 'GLOBAL_SEARCH', roleName: 'Global Search', roleDescription: 'Is allowed to search' },
      { roleCode: 'LICENCE_VARY', roleName: 'Licence Vary', roleDescription: 'Vary a license' },
    ],
  ): SuperAgentRequest =>
    stubJson({
      urlPath: `/manage-users-api/externalusers/me/searchable-roles`,
      body: roles,
    }),

  stubExternalUserAddRoles: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: `/manage-users-api/externalusers/.*/roles`,
      body: {},
    }),

  stubExternalUserRemoveRole: (): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      urlPattern: `/manage-users-api/externalusers/.*/roles/.*`,
    }),

  stubExternalUserAddGroup: (): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPattern: `/manage-users-api/externalusers/.*/groups/.*`,
    }),

  stubExternalUserAddGroupForbidden: (): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      status: HttpStatusCode.FORBIDDEN,
      urlPattern: `/manage-users-api/externalusers/.*/groups/.*`,
      body: { userMessage: 'Cannot maintain user' },
    }),

  stubExternalUserRemoveGroup: (): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      urlPattern: `/manage-users-api/externalusers/.*/groups/.*`,
    }),

  stubExternalUserRemoveGroupLastGroupError: (): SuperAgentRequest =>
    stubJson({
      method: 'DELETE',
      status: HttpStatusCode.FORBIDDEN,
      urlPattern: `/manage-users-api/externalusers/.*/groups/.*`,
      body: { userMessage: 'Last group' },
    }),

  stubExternalUserChangeEmail: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPattern: `/manage-users-api/externalusers/.*/email`,
    }),

  stubExternalUserEnable: (): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPattern: `/manage-users-api/externalusers/.*/enable`,
    }),

  stubExternalUserDisable: (): SuperAgentRequest =>
    stubJson({
      method: 'PUT',
      urlPattern: `/manage-users-api/externalusers/.*/disable`,
    }),

  stubAddAllowlistUser: (): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPath: '/manage-users-api/users/allowlist',
      status: HttpStatusCode.CREATED,
    }),

  stubSearchAllowlistUsers: ({
    totalElements = 1,
    page = 0,
    size = 20,
    content,
  }: {
    totalElements?: number
    page?: number
    size?: number
    content?: UserAllowlistDetail[]
  } = {}): SuperAgentRequest =>
    stubJson({
      urlPath: '/manage-users-api/users/allowlist',
      body: {
        content:
          content ?? replicateAllowlistUser(Math.floor(totalElements / size) === page ? totalElements % size : size),
        size,
        totalElements,
        number: page,
        numberOfElements: totalElements < size ? totalElements : size,
      },
    }),

  stubGetAllowlistUser: (user: Partial<UserAllowlistDetail>): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/manage-users-api/users/allowlist/${user.username}`,
      },
      response: {
        status: HttpStatusCode.OK,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          id: 'a073bfc1-2f81-4b6d-9b9c-fd7c367fe4c7',
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          reason: user.reason,
          accessPeriod: user.accessPeriod,
          createdOn: user.createdOn,
          allowlistEndDate: user.allowlistEndDate,
          lastUpdated: user.lastUpdated,
          lastUpdatedBy: user.lastUpdatedBy,
          approver: user.approver,
        },
      },
    }),

  stubGetAllowlistUserNotFound: (username: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/manage-users-api/users/allowlist/${username}`,
      },
      response: {
        status: HttpStatusCode.NOT_FOUND,
      },
    }),

  stubUpdateAllowlistUserAccess: (id: string, request?: UserAllowlistPatchRequest): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'PATCH',
        urlPath: `/manage-users-api/users/allowlist/${id}`,
        bodyPatterns: request ? [{ equalToJson: request }] : undefined,
      },
      response: {
        status: HttpStatusCode.OK,
      },
    }),

  stubGetBulkUserRolesAdditions: (
    body: { content: BulkUserRoleAdditionsJobSummary[]; number?: number; totalElements?: number } = { content: [] },
  ): SuperAgentRequest =>
    stubJson({
      urlPath: '/manage-users-api/bulk-jobs/user-role-additions',
      body: {
        size: 20,
        numberOfElements: body.content.length,
        number: 0,
        totalElements: body.content.length,
        ...body,
      },
    }),

  stubGetBulkUserRolesAdditionsWithSearch: ({
    responseBody,
    searchTerm,
  }: {
    responseBody: { content: BulkUserRoleAdditionsJobSummary[]; number?: number; totalElements?: number }
    searchTerm: string
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: '/manage-users-api/bulk-jobs/user-role-additions',
        queryParameters: { search: { equalTo: searchTerm } },
      },
      response: {
        status: HttpStatusCode.OK,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          size: 20,
          numberOfElements: responseBody.content.length,
          number: 0,
          totalElements: responseBody.content.length,
          ...responseBody,
        },
      },
    }),

  stubGetBulkUserRolesAdditionsByPage: ({
    response,
    pageNumber,
  }: {
    response: { content: BulkUserRoleAdditionsJobSummary[]; number?: number; totalElements?: number }
    pageNumber: string
  }): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPathPattern: '/manage-users-api/bulk-jobs/user-role-additions',
        queryParameters: { pageNumber: { equalTo: pageNumber } },
      },
      response: {
        status: HttpStatusCode.OK,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: {
          size: 20,
          numberOfElements: response.content.length,
          number: Number(pageNumber),
          totalElements: response.content.length,
          ...response,
        },
      },
    }),

  stubGetBulkUserRolesAdditionsError: (
    status: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
  ): SuperAgentRequest =>
    stubJson({
      urlPath: '/manage-users-api/bulk-jobs/user-role-additions',
      status,
      body: { message: 'error getting requests' },
    }),

  stubGetBulkUserRolesAdditionsDetails: ({
    id,
    status = HttpStatusCode.OK,
    responseBody,
  }: {
    id: string
    status?: HttpStatusCode
    responseBody?: BulkUserRoleAdditionsJobDetails
  }): SuperAgentRequest =>
    stubJson({
      urlPath: `/manage-users-api/bulk-jobs/user-role-additions/${id}`,
      status,
      body: responseBody,
    }),

  stubCreateBulkUserRolesAdditions: (
    body: BulkUserRoleAdditionsRequest,
    status: HttpStatusCode = HttpStatusCode.OK,
  ): SuperAgentRequest =>
    stubJson({
      method: 'POST',
      urlPath: '/manage-users-api/bulk-jobs/user-role-additions',
      status,
      body: { id: '1', ...body },
    }),

  stubGetBulkUserRolesAdditionsCsvDownload: (id: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/manage-users-api/bulk-jobs/user-role-additions/${id}/download`,
      },
      response: {
        status: HttpStatusCode.OK,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="bulk-roles-assignments-${id}.csv"`,
        },
        body: 'userId,role,status,message\nuser_1,role_1,SUCCESS,\nuser_2,role_1,ERROR,already assigned\n',
      },
    }),

  stubGetBulkUserRolesAdditionsCsvDownloadError: (id: string): SuperAgentRequest =>
    stubFor({
      request: {
        method: 'GET',
        urlPath: `/manage-users-api/bulk-jobs/user-role-additions/${id}/download`,
      },
      response: {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        headers: { 'Content-Type': 'application/json;charset=UTF-8' },
        jsonBody: { message: 'Das Boom!' },
      },
    }),
}
