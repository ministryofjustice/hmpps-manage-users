const { nomisUsersAndRolesFactory } = require('./nomisUsersAndRolesApi')

const client = {}
const nomisUsersAndRolesApi = nomisUsersAndRolesFactory(client)
const context = { some: 'context' }

describe('nomis users and roles API tests', () => {
  describe('userSearch', () => {
    const userResponse = {
      content: [
        {
          username: 'VQA73T',
          staffId: 402634,
          firstName: 'Aanathar',
          lastName: 'Aalasha',
          active: false,
          activeCaseload: null,
          dpsRoleCount: 0,
        },
        {
          username: 'TQQ74V',
          staffId: 19232,
          firstName: 'Admdasa',
          lastName: 'Aalasha',
          active: true,
          activeCaseload: {
            id: 'WEI',
            name: 'Wealstun (HMP)',
          },
          dpsRoleCount: 2,
        },
      ],
      pageable: {
        sort: {
          empty: false,
          sorted: true,
          unsorted: false,
        },
        offset: 0,
        pageSize: 10,
        pageNumber: 0,
        paged: true,
        unpaged: false,
      },
      last: false,
      totalPages: 10159,
      totalElements: 101584,
      size: 2,
      number: 0,
      sort: {
        empty: false,
        sorted: true,
        unsorted: false,
      },
      first: true,
      numberOfElements: 2,
      empty: false,
    }

    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => userResponse,
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
        inclusiveRoles: true,
        showOnlyLSAs: true,
      })
      expect(client.get).toBeCalledWith(
        context,
        '/users?nameFilter=RAJ&accessRoles=OMIC_ADMIN&accessRoles=OMIC_USER&status=ACTIVE&caseload=MDI&activeCaseload=BXI&size=30&page=3&inclusiveRoles=true&showOnlyLSAs=true',
      )
      expect(actual).toEqual(userResponse)
    })
    it('should call get users endpoint with default parameters', () => {
      const actual = nomisUsersAndRolesApi.userSearch(context, {})
      expect(client.get).toBeCalledWith(
        context,
        '/users?nameFilter=&accessRoles=&status=&caseload=&activeCaseload=&size=20&page=0&inclusiveRoles=&showOnlyLSAs=',
      )
      expect(actual).toEqual(userResponse)
    })
  })
})
