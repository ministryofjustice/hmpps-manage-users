const nock = require('nock')
const { manageUsersApiFactory } = require('./manageUsersApi')

const client = {}
const manageUsersApi = manageUsersApiFactory(client)
const context = { some: 'context' }

describe('manageUsersApi tests', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('createDPSUser', () => {
    const user = {
      user: {
        username: 'JOE_GEN',
        email: 'joe@digital.justice.gov.uk',
        firstName: 'joe',
        lastName: 'smith',
        userType: 'DPS_GEN',
        defaultCaseloadId: 'MDI',
      },
    }
    beforeEach(() => {
      client.post = jest.fn().mockReturnValue({
        then: () => {},
      })
      manageUsersApi.createUser(context, user)
    })
    it('should call create manage user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/prisonusers', user)
    })
  })

  describe('createRole', () => {
    const role = {
      role: { roleCode: 'role_code', roleName: 'role name', roleDescription: 'description', adminType: ['EXT_ADM'] },
    }

    beforeEach(() => {
      client.post = jest.fn().mockReturnValue({
        then: () => {},
      })
      manageUsersApi.createRole(context, role)
    })

    it('should call create role endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/roles', role)
    })
  })

  describe('roleDetails', () => {
    const roles = { role: { roleName: 'hello there' } }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.getRoleDetails(context, 'role1')
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/roles/role1')
    })
  })

  describe('allRoles', () => {
    const roles = [{ roleCode: 'RC1', roleName: 'hello there' }]
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.getRoles(context, { adminTypes: '' })
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/roles?adminTypes=')
    })
  })

  describe('allRolesWithFilters', () => {
    const roles = [{ roleCode: 'RC1', roleName: 'hello there' }]
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.getRoles(context, { adminTypes: 'DPS_ADM' })
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/roles?adminTypes=DPS_ADM')
    })
  })

  describe('allPagedRoles', () => {
    const roles = [{ roleCode: 'RC1', roleName: 'hello there' }]
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.getPagedRoles(context)
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/roles/paged?page=&size=&roleName=&roleCode=&adminTypes=')
    })
  })

  describe('allPagedRolesWithFilters', () => {
    const roles = [{ roleCode: 'RC1', roleName: 'hello there' }]
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.getPagedRoles(context, 0, 20, '', '', 'ALL')
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/roles/paged?page=0&size=20&roleName=&roleCode=&adminTypes=')
    })
  })

  describe('change role name', () => {
    const roleName = { roleName: 'rolie' }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => {},
      })
      manageUsersApi.changeRoleName(context, 'role1', roleName)
    })

    it('should call external user endpoint', () => {
      expect(client.put).toBeCalledWith(context, '/roles/role1', roleName)
    })
  })

  describe('change role description', () => {
    const roleDescription = { roleDescription: 'rolie' }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => {},
      })
      manageUsersApi.changeRoleDescription(context, 'role1', roleDescription)
    })

    it('should call external user endpoint', () => {
      expect(client.put).toBeCalledWith(context, '/roles/role1/description', roleDescription)
    })
  })

  describe('change role admin type', () => {
    const roleAdminType = { adminType: ['DPS_ADM'] }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => {},
      })
      manageUsersApi.changeRoleAdminType(context, 'role1', roleAdminType)
    })

    it('should call external user endpoint', () => {
      expect(client.put).toBeCalledWith(context, '/roles/role1/admintype', roleAdminType)
    })
  })

  describe('contextUserRoles', () => {
    const roles = { username: 'joe', dpsRoles: [{ code: 'CODE1' }] }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.contextUserRoles(context, 'joe')
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call nomis user roles endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/prisonusers/joe/roles')
    })
  })

  describe('externalUserAddRoles', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.post = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = manageUsersApi.externalUserAddRoles(context, {
        userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        roles: ['maintain'],
      })
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/roles', [
        'maintain',
      ])
    })
  })

  describe('externalUserRoles', () => {
    const roles = { bob: 'hello there' }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.externalUserRoles(context, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call external user roles endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/roles')
    })
  })

  describe('removeExternalUserRole', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = manageUsersApi.deleteExternalUserRole(context, {
        userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        role: 'maintain',
      })
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', () => {
      expect(client.del).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/roles/maintain')
    })
  })

  describe('assignableRoles', () => {
    const roles = { bob: 'hello there' }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.assignableRoles(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/assignable-roles')
    })
  })

  describe('groupDetails', () => {
    const groups = { bob: 'hello there' }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => groups,
      })
      actual = manageUsersApi.groupDetails(context, { group: 'group1' })
    })

    it('should return groups from endpoint', () => {
      expect(actual).toEqual(groups)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/groups/group1')
    })
  })

  describe('childGroupDetails', () => {
    const groups = { bob: 'hello there' }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => groups,
      })
      actual = manageUsersApi.childGroupDetails(context, { group: 'childgroup1' })
    })

    it('should return groups from endpoint', () => {
      expect(actual).toEqual(groups)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/groups/child/childgroup1')
    })
  })

  describe('deleteGroup', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = manageUsersApi.deleteGroup(context, 'DEL_1')
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call group delete endpoint', () => {
      expect(client.del).toBeCalledWith(context, '/groups/DEL_1')
    })
  })

  describe('deleteChildGroup', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = manageUsersApi.deleteChildGroup(context, 'DEL_CHILD_GRP')
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call child group delete endpoint', () => {
      expect(client.del).toBeCalledWith(context, '/groups/child/DEL_CHILD_GRP')
    })
  })
  describe('change group name', () => {
    const groupName = { groupName: 'newGroupName' }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => {},
      })
      manageUsersApi.changeGroupName(context, 'GRP_1', groupName)
    })

    it('should call manger user endpoint and change group name', () => {
      expect(client.put).toBeCalledWith(context, '/groups/GRP_1', groupName)
    })
  })

  describe('change child group name', () => {
    const groupName = { groupName: 'newGroupName' }

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => {},
      })
      manageUsersApi.changeChildGroupName(context, 'CHILD_GRP_1', groupName)
    })

    it('should call manger user endpoint and change child group name', () => {
      expect(client.put).toBeCalledWith(context, '/groups/child/CHILD_GRP_1', groupName)
    })
  })

  describe('addUserGroup', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = manageUsersApi.addUserGroup(context, {
        userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        group: 'maintain',
      })
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call mange users api endpoint', () => {
      expect(client.put).toBeCalledWith(
        context,
        '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/groups/maintain',
        undefined,
      )
    })
  })
  describe('userGroups', () => {
    const groups = { bob: 'hello there' }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => groups,
      })
      actual = manageUsersApi.userGroups(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
    })

    it('should return groups from endpoint', () => {
      expect(actual).toEqual(groups)
    })
    it('should call manage user api groups endpoint', () => {
      expect(client.get).toBeCalledWith(
        context,
        '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/groups?children=false',
      )
    })
  })
  describe('removeUserGroup', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = manageUsersApi.removeUserGroup(context, {
        userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        group: 'maintain',
      })
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call mange users api endpoint', () => {
      expect(client.del).toBeCalledWith(context, '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/groups/maintain')
    })
  })

  describe('enableUser', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = manageUsersApi.enableExternalUser(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', () => {
      expect(client.put).toBeCalledWith(
        context,
        '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/enable',
        undefined,
      )
    })
  })

  describe('disableUser', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.put = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = manageUsersApi.disableUser(context, { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' })
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', () => {
      expect(client.put).toBeCalledWith(
        context,
        '/externalusers/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/disable',
        undefined,
      )
    })
  })

  describe('currentRoles', () => {
    const roles = { bob: 'hello there' }
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = manageUsersApi.currentRoles(context)
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call user endpoint', () => {
      expect(client.get).toBeCalledWith(context, '/users/me/roles')
    })
  })
})
