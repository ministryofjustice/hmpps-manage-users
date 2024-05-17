import nock from 'nock'
import superagent from 'superagent'
import { ManageUsersApi, manageUsersApiFactory } from './manageUsersApi'
import { OAuthEnabledClient } from './oauthEnabledClient'
import {
  CreateExternalUserRequest,
  CreateLinkedLocalAdminRequest,
  CreateUserRequest,
  PrisonCaseload,
  Role,
  RoleDetail,
  UpdateRoleAdminTypeRequest,
  UpdateRoleDescriptionRequest,
  UpdateRoleNameRequest,
  UpdateUserEmailRequest,
  UserCaseloadDetail,
  UserRoleDetail,
} from '../@types/manageUsersApi'
import { Context } from '../interfaces/context'

const client: OAuthEnabledClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  del: jest.fn(),
}
const mockResponse = {
  then: (res: superagent.Response) => {
    return res
  },
}

const manageUsersApi: ManageUsersApi = manageUsersApiFactory(client)
const context: Context = {}

describe('manageUsersApiImport tests', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('currentUser', () => {
    const userDetails = { bob: 'hello there' }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => userDetails,
      })
    })

    it('should return user details from endpoint', async () => {
      const actual = await manageUsersApi.currentUser(context)
      expect(actual).toEqual(userDetails)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.currentUser(context)
      expect(client.get).toBeCalledWith(context, '/users/me')
    })
  })

  describe('getUser', () => {
    const userDetails = { bob: 'hello there' }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => userDetails,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.getUser(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
      expect(actual).toEqual(userDetails)
    })
    it('should call external user endpoint', async () => {
      await manageUsersApi.getUser(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
      expect(client.get).toBeCalledWith(context, '/externalusers/id/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
    })
  })

  describe('getUserEmail', () => {
    const emailDetails = { email: 'hello@there', username: 'someuser' }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => emailDetails,
      })
    })

    it('should return email from endpoint', async () => {
      const actual = await manageUsersApi.getUserEmail(context, { username: 'joe' })
      expect(actual).toEqual(emailDetails)
    })
    it('should call user email endpoint', () => {
      manageUsersApi.getUserEmail(context, { username: 'joe' })
      expect(client.get).toBeCalledWith(context, '/users/joe/email?unverified=true')
    })
    it('should cope with not found from endpoint', async () => {
      const error = { ...new Error('User not found'), status: 404 }
      client.get = jest.fn().mockRejectedValue(error)
      const actual = await manageUsersApi.getUserEmail(context, { username: 'joe' })
      expect(actual).toEqual({})
    })
    it('should rethrow other errors', async () => {
      const error = new Error('User not found')
      client.get = jest.fn().mockRejectedValue(error)
      expect(async () => manageUsersApi.getUserEmail(context, { username: 'joe' })).rejects.toThrow(error)
    })
  })

  describe('amendUserEmail', () => {
    const newEmail = 'testy@testing.com'
    const userId = '1234'
    const request: UpdateUserEmailRequest = {
      email: newEmail,
    }

    beforeEach(() => {
      client.post = jest.fn().mockReturnValue(mockResponse)
    })

    it('should call create manage user endpoint', async () => {
      await manageUsersApi.amendUserEmail(context, userId, request)
      expect(client.post).toBeCalledWith(context, '/externalusers/1234/email', request)
    })
  })

  describe('createDPSUser', () => {
    const request: CreateUserRequest = {
      username: 'JOE_GEN',
      email: 'joe@digital.justice.gov.uk',
      firstName: 'joe',
      lastName: 'smith',
      userType: 'DPS_GEN',
      defaultCaseloadId: 'MDI',
    }
    beforeEach(() => {
      client.post = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.createUser(context, request)
    })
    it('should call create manage user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/prisonusers', request)
    })
  })

  describe('searchUserByUsername', () => {
    beforeEach(() => {
      client.get = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.searchUserByUserName(context, 'JOE_GEN')
    })
    it('should call create manage user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/prisonusers/JOE_GEN')
    })
  })

  describe('linkAdminUserToExistingGeneralAccount', () => {
    const user = {
      existingUsername: 'BOB_GEN',
      adminUsername: 'BOB_ADM',
    }
    beforeEach(() => {
      client.post = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.createLinkedCentralAdminUser(context, user)
    })
    it('should call create manage user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/linkedprisonusers/admin', user)
    })
  })

  describe('linkLsaUserToExistingGeneralAccount', () => {
    const request: CreateLinkedLocalAdminRequest = {
      existingUsername: 'BOB_GEN',
      adminUsername: 'BOB_LSA',
      localAdminGroup: 'smith',
    }
    beforeEach(() => {
      client.post = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.createLinkedLsaUser(context, request)
    })
    it('should call create manage user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/linkedprisonusers/lsa', request)
    })
  })

  describe('linkGeneralUserToExistingAdminAccount', () => {
    const user = {
      existingAdminUsername: 'BOB_ADM',
      generalUsername: 'bob',
      defaultCaseloadId: 'smith',
    }
    beforeEach(() => {
      client.post = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.createLinkedGeneralUser(context, user)
    })
    it('should call create manage user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/linkedprisonusers/general', user)
    })
  })

  describe('createRole', () => {
    beforeEach(() => {
      client.post = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.createRole(context, 'role_code')
    })

    it('should call create role endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/roles', 'role_code')
    })
  })

  describe('roleDetails', () => {
    const role: Role = {
      roleCode: 'RC1',
      roleName: 'hello there',
      roleDescription: 'hello there',
      adminType: [
        {
          adminTypeCode: 'DPS_ADM',
          adminTypeName: 'DPS Admin',
        },
      ],
    }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => role,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual: Role = await manageUsersApi.getRoleDetails(context, 'role1')
      expect(actual).toEqual(role)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.getRoleDetails(context, 'role1')
      expect(client.get).toBeCalledWith(context, '/roles/role1')
    })
  })

  describe('allRoles', () => {
    const roles = [{ roleCode: 'RC1', roleName: 'hello there' }]
    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.getRoles(context, { adminTypes: '' })
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.getRoles(context, { adminTypes: '' })
      expect(client.get).toBeCalledWith(context, '/roles?adminTypes=')
    })
  })

  describe('allRolesWithFilters', () => {
    const roles = [{ roleCode: 'RC1', roleName: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.getRoles(context, { adminTypes: 'DPS_ADM' })
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.getRoles(context, { adminTypes: 'DPS_ADM' })
      expect(client.get).toBeCalledWith(context, '/roles?adminTypes=DPS_ADM')
    })
  })

  describe('allPagedRoles', () => {
    const roles = [{ roleCode: 'RC1', roleName: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.getPagedRoles(context, 1, 20, '', '', 'ALL')
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.getPagedRoles(context, 1, 20, '', '', 'ALL')
      expect(client.get).toBeCalledWith(context, '/roles/paged?page=1&size=20&roleName=&roleCode=&adminTypes=')
    })
  })

  describe('allPagedRolesWithFilters', () => {
    const roles = [{ roleCode: 'RC1', roleName: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.getPagedRoles(context, 0, 20, '', '', 'ALL')
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.getPagedRoles(context, 0, 20, '', '', 'ALL')
      expect(client.get).toBeCalledWith(context, '/roles/paged?page=0&size=20&roleName=&roleCode=&adminTypes=')
    })
  })

  describe('change role name', () => {
    const request: UpdateRoleNameRequest = {
      roleName: 'rolie',
    }
    beforeEach(() => {
      client.put = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.changeRoleName(context, 'role1', request)
    })

    it('should call external user endpoint', () => {
      expect(client.put).toBeCalledWith(context, '/roles/role1', request)
    })
  })

  describe('change role description', () => {
    const request: UpdateRoleDescriptionRequest = {
      roleDescription: 'rolie',
    }
    beforeEach(() => {
      client.put = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.changeRoleDescription(context, 'role1', request)
    })

    it('should call external user endpoint', () => {
      expect(client.put).toBeCalledWith(context, '/roles/role1/description', request)
    })
  })

  describe('change role admin type', () => {
    const request: UpdateRoleAdminTypeRequest = {
      adminType: ['DPS_ADM'],
    }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.changeRoleAdminType(context, 'role1', request)
    })

    it('should call external user endpoint', () => {
      expect(client.put).toBeCalledWith(context, '/roles/role1/admintype', request)
    })
  })

  describe('contextUserRoles', () => {
    const roleDetail: RoleDetail = {
      code: 'RC1',
      name: 'hello there',
      sequence: 1,
      adminRoleOnly: false,
    }
    const roles: UserRoleDetail = {
      username: 'joe',
      active: true,
      accountType: 'GENERAL',
      dpsRoles: [roleDetail],
    }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.contextUserRoles(context, 'joe')
      expect(actual).toEqual(roles)
    })
    it('should call nomis user roles endpoint', async () => {
      await manageUsersApi.contextUserRoles(context, 'joe')
      expect(client.get).toBeCalledWith(context, '/prisonusers/joe/roles')
    })
  })

  describe('externalUserAddRoles', () => {
    const errorResponse = { field: 'hello' }
    beforeEach(() => {
      client.post = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.externalUserAddRoles(context, {
        userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        roles: ['maintain'],
      })
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.externalUserAddRoles(context, {
        userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        roles: ['maintain'],
      })
      expect(client.post).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/roles', [
        'maintain',
      ])
    })
  })

  describe('externalUserRoles', () => {
    const roles = [{ roleCode: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.externalUserRoles(context, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
      expect(actual).toEqual(roles)
    })
    it('should call external user roles endpoint', async () => {
      await manageUsersApi.externalUserRoles(context, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
      expect(client.get).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/roles')
    })
  })

  describe('removeExternalUserRole', () => {
    const errorResponse = { field: 'hello' }
    const request = {
      userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
      role: 'maintain',
    }

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.deleteExternalUserRole(context, request)
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.deleteExternalUserRole(context, request)
      expect(client.del).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/roles/maintain')
    })
  })

  describe('assignableRoles', () => {
    const roles = [{ roleCode: 'hello there' }]
    const request = { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.assignableRoles(context, request)
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.assignableRoles(context, request)
      expect(client.get).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/assignable-roles')
    })
  })

  describe('groupDetails', () => {
    const groups = { bob: 'hello there' }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => groups,
      })
    })

    it('should return groups from endpoint', async () => {
      const actual = await manageUsersApi.groupDetails(context, { group: 'group1' })
      expect(actual).toEqual(groups)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.groupDetails(context, { group: 'group1' })
      expect(client.get).toBeCalledWith(context, '/groups/group1')
    })
  })

  describe('childGroupDetails', () => {
    const groups = { bob: 'hello there' }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => groups,
      })
    })

    it('should return groups from endpoint', async () => {
      const actual = await manageUsersApi.childGroupDetails(context, { group: 'childgroup1' })
      expect(actual).toEqual(groups)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.childGroupDetails(context, { group: 'childgroup1' })
      expect(client.get).toBeCalledWith(context, '/groups/child/childgroup1')
    })
  })

  describe('deleteGroup', () => {
    const errorResponse = { field: 'hello' }

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.deleteGroup(context, 'DEL_1')
      expect(actual).toEqual(errorResponse)
    })
    it('should call group delete endpoint', async () => {
      await manageUsersApi.deleteGroup(context, 'DEL_1')
      expect(client.del).toBeCalledWith(context, '/groups/DEL_1')
    })
  })

  describe('deleteChildGroup', () => {
    const errorResponse = { field: 'hello' }

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.deleteChildGroup(context, 'DEL_CHILD_GRP')
      expect(actual).toEqual(errorResponse)
    })
    it('should call child group delete endpoint', async () => {
      await manageUsersApi.deleteChildGroup(context, 'DEL_CHILD_GRP')
      expect(client.del).toBeCalledWith(context, '/groups/child/DEL_CHILD_GRP')
    })
  })

  describe('assignableGroups', () => {
    const groups = [
      {
        groupCode: 'hello there',
        groupName: 'hello there',
      },
    ]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => groups,
      })
    })

    it('should return groups from endpoint', async () => {
      const actual = await manageUsersApi.assignableGroups(context)
      expect(actual).toEqual(groups)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.assignableGroups(context)
      expect(client.get).toBeCalledWith(context, '/externalusers/me/assignable-groups')
    })
  })

  describe('change group name', () => {
    const groupName = { groupName: 'newGroupName' }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.changeGroupName(context, 'GRP_1', groupName)
    })

    it('should call manger user endpoint and change group name', () => {
      expect(client.put).toBeCalledWith(context, '/groups/GRP_1', groupName)
    })
  })

  describe('change child group name', () => {
    const groupName = { groupName: 'newGroupName' }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue(mockResponse)
      manageUsersApi.changeChildGroupName(context, 'CHILD_GRP_1', groupName)
    })

    it('should call manger user endpoint and change child group name', () => {
      expect(client.put).toBeCalledWith(context, '/groups/child/CHILD_GRP_1', groupName)
    })
  })

  describe('addUserGroup', () => {
    const errorResponse = { field: 'hello' }
    const request = {
      userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
      group: 'maintain',
    }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.addUserGroup(context, request)
      expect(actual).toEqual(errorResponse)
    })
    it('should call mange users api endpoint', async () => {
      await manageUsersApi.addUserGroup(context, request)
      expect(client.put).toBeCalledWith(
        context,
        '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/groups/maintain',
        undefined,
      )
    })
  })
  describe('userGroups', () => {
    const groups = [{ groupCode: 'hello there', groupName: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => groups,
      })
    })

    it('should return groups from endpoint', async () => {
      const actual = await manageUsersApi.userGroups(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
      expect(actual).toEqual(groups)
    })
    it('should call manage user api groups endpoint', async () => {
      await manageUsersApi.userGroups(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
      expect(client.get).toBeCalledWith(
        context,
        '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/groups?children=false',
      )
    })
  })
  describe('removeUserGroup', () => {
    const errorResponse = { field: 'hello' }
    const request = {
      userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
      group: 'maintain',
    }
    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.removeUserGroup(context, request)
      expect(actual).toEqual(errorResponse)
    })
    it('should call mange users api endpoint', async () => {
      await manageUsersApi.removeUserGroup(context, request)
      expect(client.del).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/groups/maintain')
    })
  })

  describe('enableExternalUser', () => {
    const errorResponse = { field: 'hello' }
    const request = { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.enableExternalUser(context, request)
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.enableExternalUser(context, request)
      expect(client.put).toBeCalledWith(
        context,
        '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/enable',
        undefined,
      )
    })
  })

  describe('disableExternalUser', () => {
    const errorResponse = { field: 'hello' }
    const request = { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }
    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.disableExternalUser(context, request)
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.disableExternalUser(context, request)
      expect(client.put).toBeCalledWith(
        context,
        '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/disable',
        undefined,
      )
    })
  })

  describe('deactivateExternalUser', () => {
    const errorResponse = { field: 'hello' }
    const request = {
      userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
      reason: 'user suspended',
    }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.deactivateExternalUser(context, request)
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.deactivateExternalUser(context, request)
      expect(client.put).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/disable', {
        reason: 'user suspended',
      })
    })
  })

  describe('externalUserSearch', () => {
    const userDetails = { bob: 'hello there' }
    const userSearch = {
      nameFilter: "joe'fred@bananas%.com",
      role: '',
      group: '',
      status: 'ALL',
    }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({ then: () => userDetails })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.userSearch(context, userSearch)
      expect(actual).toEqual(userDetails)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.userSearch(context, userSearch)
      expect(client.get).toBeCalledWith(
        context,
        "/externalusers/search?name=joe'fred%40bananas%25.com&groups=&roles=&status=ALL&page=&size=",
      )
    })
  })

  describe('currentRoles', () => {
    const roles = [{ roleCode: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
    })

    it('should return roles from endpoint', async () => {
      const actual = await manageUsersApi.currentRoles(context)
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.currentRoles(context)
      expect(client.get).toBeCalledWith(context, '/users/me/roles')
    })
  })

  describe('changeDPSEmail', () => {
    beforeEach(() => {
      client.post = jest.fn().mockReturnValue(mockResponse)
    })

    it('should call user endpoint', async () => {
      await manageUsersApi.changeDpsEmail(context, 'joe', 'joe@digital.justice.gov.uk')
      expect(client.post).toBeCalledWith(context, '/prisonusers/joe/email', 'joe@digital.justice.gov.uk')
    })
  })

  describe('createExternalUser', () => {
    const request: CreateExternalUserRequest = {
      firstName: 'joe',
      lastName: 'smith',
      email: 'joe@example.com',
      groupCodes: ['GROUP_1'],
    }

    beforeEach(() => {
      client.post = jest.fn().mockReturnValue(mockResponse)
    })

    it('should call external user endpoint', async () => {
      await manageUsersApi.createExternalUser(context, request)
      expect(client.post).toBeCalledWith(context, '/externalusers/create', request)
    })
  })

  describe('enablePrisonUser', () => {
    const errorResponse = { field: 'hello' }
    const username = 'bob'

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.enablePrisonUser(context, username)
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.enablePrisonUser(context, username)
      expect(client.put).toBeCalledWith(context, `/prisonusers/${username}/enable-user`, undefined)
    })
  })

  describe('disablePrisonUser', () => {
    const errorResponse = { field: 'hello' }
    const username = 'bob'

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
    })

    it('should return any error from endpoint', async () => {
      const actual = await manageUsersApi.disablePrisonUser(context, username)
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', async () => {
      await manageUsersApi.disablePrisonUser(context, username)
      expect(client.put).toBeCalledWith(context, `/prisonusers/${username}/disable-user`, undefined)
    })
  })

  describe('getCaseloads', () => {
    const response = [{ id: 'MDI', name: 'Moorland' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => response,
      })
    })

    it('will call /prisonusers/reference-data/caseloads endpoint', () => {
      manageUsersApi.getCaseloads(context)

      expect(client.get).toBeCalledWith(context, '/prisonusers/reference-data/caseloads')
    })
    it('will return the caseloads', () => {
      const expected: PrisonCaseload[] = [{ id: 'MDI', name: 'Moorland' }]

      expect(manageUsersApi.getCaseloads(context)).toEqual(expected)
    })
  })

  describe('getUserCaseloads', () => {
    const response = [{ id: 'MDI', name: 'Moorland' }]
    const username = 'bob'

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => response,
      })
    })

    it('will call /prisonusers/{username}/caseloads endpoint', () => {
      manageUsersApi.getUserCaseloads(context, username)

      expect(client.get).toBeCalledWith(context, `/prisonusers/${username}/caseloads`)
    })

    it('will return the caseloads', () => {
      const expected: PrisonCaseload[] = [{ id: 'MDI', name: 'Moorland' }]

      expect(manageUsersApi.getUserCaseloads(context, username)).toEqual(expected)
    })
  })

  describe('addUserCaseloads', () => {
    const errorResponse = { field: 'hello' }
    let actual: UserCaseloadDetail

    beforeEach(async () => {
      client.post = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = await manageUsersApi.addUserCaseloads(context, 'TEST_USER', ['TEST_CASELOAD'])
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/prisonusers/TEST_USER/caseloads', ['TEST_CASELOAD'])
    })
  })

  describe('removeUserCaseload', () => {
    const errorResponse = { field: 'hello' }
    let actual: UserCaseloadDetail

    beforeEach(async () => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = await manageUsersApi.removeUserCaseload(context, 'TEST_USER', 'TEST_CASELOAD')
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call remove user caseload endpoint', () => {
      expect(client.del).toBeCalledWith(context, '/prisonusers/TEST_USER/caseloads/TEST_CASELOAD')
    })
  })
})
