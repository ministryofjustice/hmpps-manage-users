const { nomisUsersAndRolesFactory } = require('./nomisUsersAndRolesApi')

const client = {}
const nomisUsersAndRolesApi = nomisUsersAndRolesFactory(client)
const context = { some: 'context' }

describe('nomis users and roles API tests', () => {
  describe('userSearch', () => {
    const users = [{ bob: 'hello there' }]

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => users,
      })
    })

    it('should call get users endpoint passing request parameters', () => {
      const actual = nomisUsersAndRolesApi.userSearch(context, {
        nameFilter: 'RAJ',
        status: 'ACTIVE',
        accessRoles: ['OMIC_ADMIN', 'OMIC_USER'],
        caseload: 'MDI',
        activeCaseload: 'BXI',
        size: 30,
        page: 3,
      })
      expect(client.get).toBeCalledWith(
        context,
        '/users?nameFilter=RAJ&accessRoles=OMIC_ADMIN&accessRoles=OMIC_USER&status=ACTIVE&caseload=MDI&activeCaseload=BXI&size=30&page=3',
      )
      expect(actual).toEqual(users)
    })
    it('should call get users endpoint with default parameters', () => {
      const actual = nomisUsersAndRolesApi.userSearch(context, {})
      expect(client.get).toBeCalledWith(
        context,
        '/users?nameFilter=&accessRoles=&status=&caseload=&activeCaseload=&size=20&page=0',
      )
      expect(actual).toEqual(users)
    })
  })
})
