const nock = require('nock')
const { manageUsersApiFactory } = require('./manageUsersApi')

const client = {}
const manageUsersApi = manageUsersApiFactory(client)
const context = { some: 'context' }

describe('manageUsersApi tests', () => {
  beforeEach(() => {
    nock.cleanAll()
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
})
