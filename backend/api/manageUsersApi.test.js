const nock = require('nock')
const { manageUsersApiFactory } = require('./manageUsersApi')

const client = {}
const manageUsersApi = manageUsersApiFactory(client)
const context = { some: 'context' }

describe('manageUsersApi tests', () => {
  beforeEach(() => {
    nock.cleanAll()
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
})
