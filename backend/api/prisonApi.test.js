const { prisonApiFactory } = require('./prisonApi')

const client = {}
const prisonApi = prisonApiFactory(client)
const context = { some: 'context' }

describe('prisonApi tests', () => {
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
  describe('userSearch', () => {
    const users = [{ bob: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => users,
      })
    })

    it('should call get users endpoint', () => {
      const actual = prisonApi.userSearch(context, { nameFilter: '', status: '', roleFilter: '' })
      expect(client.get).toBeCalledWith(
        context,
        '/api/users/local-administrator/available?nameFilter=&accessRole=&status=',
        undefined,
      )
      expect(actual).toEqual(users)
    })

    it('should call get users endpoint when filter attributes are undefined', () => {
      const actual = prisonApi.userSearch(context, {})
      expect(client.get).toBeCalledWith(
        context,
        '/api/users/local-administrator/available?nameFilter=&accessRole=&status=',
        undefined,
      )
      expect(actual).toEqual(users)
    })
    it('should encode any names', () => {
      const actual = prisonApi.userSearch(context, { nameFilter: "Joe O'Brien", status: '', roleFilter: '' })
      expect(client.get).toBeCalledWith(
        context,
        "/api/users/local-administrator/available?nameFilter=Joe%20O'Brien&accessRole=&status=",
        undefined,
      )
      expect(actual).toEqual(users)
    })
    it('should supply all filters', () => {
      const actual = prisonApi.userSearch(context, {
        nameFilter: "Joe O'Brien",
        status: 'INACTIVE',
        roleFilter: 'OMIC_ADMIN',
      })
      expect(client.get).toBeCalledWith(
        context,
        "/api/users/local-administrator/available?nameFilter=Joe%20O'Brien&accessRole=OMIC_ADMIN&status=INACTIVE",
        undefined,
      )
      expect(actual).toEqual(users)
    })
    it('should supply multiple roles when supplied as a list', () => {
      const actual = prisonApi.userSearch(context, {
        nameFilter: "Joe O'Brien",
        status: 'INACTIVE',
        roleFilter: ['OMIC_ADMIN', 'OMIC_USER'],
      })
      expect(client.get).toBeCalledWith(
        context,
        "/api/users/local-administrator/available?nameFilter=Joe%20O'Brien&accessRole=OMIC_ADMIN&accessRole=OMIC_USER&status=INACTIVE",
        undefined,
      )
      expect(actual).toEqual(users)
    })
  })
})
