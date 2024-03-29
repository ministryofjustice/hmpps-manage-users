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

  describe('removeUserRole', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = nomisUsersAndRolesApi.removeUserRole(context, 'TEST_USER', 'TEST_ROLE')
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call remove user role endpoint', () => {
      expect(client.del).toBeCalledWith(context, '/users/TEST_USER/roles/TEST_ROLE')
    })
  })

  describe('getCaseloads', () => {
    const caseloadResponse = [
      {
        id: 'AKI',
        name: 'Acklington (HMP)',
      },
      {
        id: 'ALI',
        name: 'Albany (HMP)',
      },
      {
        id: 'ACI',
        name: 'Altcourse (HMP)',
      },
    ]
    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => caseloadResponse,
      })
    })

    it('will call /reference-data/caseloads endpoint', () => {
      nomisUsersAndRolesApi.getCaseloads(context)

      expect(client.get).toBeCalledWith(context, '/reference-data/caseloads')
    })
    it('will return the caseloads', () => {
      expect(nomisUsersAndRolesApi.getCaseloads(context)).toEqual(caseloadResponse)
    })
  })

  describe('getUserCaseloads', () => {
    const userCaseloadResponse = [
      {
        id: 'AKI',
        name: 'Acklington (HMP)',
      },
      {
        id: 'ALI',
        name: 'Albany (HMP)',
      },
      {
        id: 'ACI',
        name: 'Altcourse (HMP)',
      },
    ]
    beforeEach(() => {
      client.get = jest.fn().mockReturnValue({
        then: () => userCaseloadResponse,
      })
    })
    it('will call /users/{username}/caseloads endpoint', () => {
      const actual = nomisUsersAndRolesApi.getUserCaseloads(context, 'TEST_USER')

      expect(client.get).toBeCalledWith(context, '/users/TEST_USER/caseloads')
      expect(actual).toEqual(userCaseloadResponse)
    })
  })

  describe('addUserCaseloads', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.post = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = nomisUsersAndRolesApi.addUserCaseloads(context, 'TEST_USER', ['TEST_CASELOAD'])
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call user endpoint', () => {
      expect(client.post).toBeCalledWith(context, '/users/TEST_USER/caseloads', ['TEST_CASELOAD'])
    })
  })

  describe('removeUserCaseload', () => {
    const errorResponse = { field: 'hello' }
    let actual

    beforeEach(() => {
      client.del = jest.fn().mockReturnValue({
        then: () => errorResponse,
      })
      actual = nomisUsersAndRolesApi.removeUserCaseload(context, 'TEST_USER', 'TEST_CASELOAD')
    })

    it('should return any error from endpoint', () => {
      expect(actual).toEqual(errorResponse)
    })
    it('should call remove user caseload endpoint', () => {
      expect(client.del).toBeCalledWith(context, '/users/TEST_USER/caseloads/TEST_CASELOAD')
    })
  })
})
