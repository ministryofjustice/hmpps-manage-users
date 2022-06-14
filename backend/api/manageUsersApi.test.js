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
      expect(client.post).toBeCalledWith(context, '/users', user)
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
      expect(client.get).toBeCalledWith(context, '/users/joe/roles')
    })
  })
})
