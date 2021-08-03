const { prisonApiFactory } = require('./prisonApi')

const client = {}
const prisonApi = prisonApiFactory(client)
const context = { some: 'context' }

describe('prisonApi tests', () => {
  describe('contextUserRoles', () => {
    const roles = [{ bob: 'hello there' }]
    let actual

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => roles,
      })
      actual = prisonApi.contextUserRoles(context, 'joe', true)
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual(roles)
    })
    it('should call auth roles endpoint', () => {
      expect(client.get).toBeCalledWith(
        context,
        '/api/users/joe/access-roles/caseload/NWEB?includeAdmin=true',
        undefined,
      )
    })
  })

  describe('assignableRoles', () => {
    const userRoles = [{ roleCode: 'hello there' }]
    const allRoles = [{ roleCode: 'hello there' }, { roleCode: 'not yet assigned' }]
    let actual

    beforeEach(async () => {
      client.get = jest
        .fn()
        .mockReturnValueOnce({ then: () => userRoles })
        .mockReturnValueOnce({ then: () => allRoles })
      actual = await prisonApi.assignableRoles(context, 'joe', true)
    })

    it('should return roles from endpoint', () => {
      expect(actual).toEqual([{ roleCode: 'not yet assigned' }])
    })
    it('should call auth roles endpoint', () => {
      expect(client.get).toBeCalledWith(
        context,
        '/api/users/joe/access-roles/caseload/NWEB?includeAdmin=true',
        undefined,
      )
    })
  })
  describe('userSearchAdmin', () => {
    const users = [{ bob: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => users,
      })
    })

    it('should call get users endpoint', () => {
      const actual = prisonApi.userSearchAdmin(context, {})
      expect(client.get).toBeCalledWith(
        context,
        '/api/users?nameFilter=&accessRole=&status=&caseload=&activeCaseload=',
        undefined,
      )
      expect(actual).toEqual(users)
    })

    it('should encode any names', () => {
      const actual = prisonApi.userSearchAdmin(context, { nameFilter: "Joe O'Brien" })
      expect(client.get).toBeCalledWith(
        context,
        "/api/users?nameFilter=Joe%20O'Brien&accessRole=&status=&caseload=&activeCaseload=",
        undefined,
      )
      expect(actual).toEqual(users)
    })
  })
})
