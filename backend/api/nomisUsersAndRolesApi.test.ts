import { OAuthEnabledClient } from './oauthEnabledClient'
import { PagedList } from '../interfaces/pagedList'
import {
  NomisCreateRoleRequest,
  NomisGroupAdminSummaryWithEmail,
  NomisPrisonCaseload,
  NomisRoleDetail,
  NomisUpdateRoleRequest,
  NomisUserCaseloadDetail,
  NomisUserDetail,
  NomisUserSummaryWithEmail,
} from '../@types/nomisUserRolesApi'
import { nomisUsersAndRolesFactory, PagedUserSearchParams, UserSearchParams } from './nomisUsersAndRolesApi'
import { Context } from '../interfaces/context'
import { mockRejectedValue, mockResolvedValue } from '../tests/testUtils'

/*
  These tests ensure that the nomisUsersAndRolesApi functions are wired up correctly

  We mock the client to return a JSON response, and then check the module converts that to an expected type
  We also mock the client to throw an error and check that the error is thrown correctly

  The tests are otherwise quite simple, as the functions are just wrappers around the client
 */

const client: OAuthEnabledClient = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  del: jest.fn(),
}
const nomisUsersAndRolesApi = nomisUsersAndRolesFactory(client)
const context = {} as Context

describe('nomis users and roles API tests', () => {
  describe('userSearch', () => {
    const searchParams: PagedUserSearchParams = {
      nameFilter: 'RAJ',
      accessRoles: ['OMIC_ADMIN', 'OMIC_USER'],
      status: 'ACTIVE',
      caseload: 'MDI',
      activeCaseload: 'BXI',
      inclusiveRoles: true,
      showOnlyLSAs: true,
      size: 30,
      page: 3,
    }
    const response: unknown = {
      content: [
        {
          username: 'VQA73T',
          staffId: 402634,
          firstName: 'Aanathar',
          lastName: 'Aalasha',
          active: false,
          activeCaseload: null,
          dpsRoleCount: 0,
          locked: false,
          expired: false,
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
          locked: false,
          expired: false,
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

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.userSearch(context, searchParams)

      // assert that the client was called with the correct parameters
      expect(client.get).toBeCalledWith(
        context,
        '/users?nameFilter=RAJ&accessRoles=OMIC_ADMIN&accessRoles=OMIC_USER&status=ACTIVE&caseload=MDI&activeCaseload=BXI&size=30&page=3&inclusiveRoles=true&showOnlyLSAs=true',
      )
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as PagedList<NomisUserSummaryWithEmail>

      // call the function
      const actual = await nomisUsersAndRolesApi.userSearch(context, searchParams)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.userSearch(context, searchParams)).rejects.toThrow(error)
    })
  })

  describe('downloadUserSearch', () => {
    const searchParams: UserSearchParams = {
      nameFilter: 'RAJ',
      accessRoles: ['OMIC_ADMIN', 'OMIC_USER'],
      status: 'ACTIVE',
      caseload: 'MDI',
      activeCaseload: 'BXI',
      inclusiveRoles: true,
      showOnlyLSAs: true,
    }
    const response: unknown = [
      {
        username: 'VQA73T',
        staffId: 402634,
        firstName: 'Aanathar',
        lastName: 'Aalasha',
        active: false,
        activeCaseload: null,
        dpsRoleCount: 0,
        locked: false,
        expired: false,
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
        locked: false,
        expired: false,
      },
    ]

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.downloadUserSearch(context, searchParams)

      // assert that the client was called with the correct parameters
      expect(client.get).toBeCalledWith(
        context,
        '/users/download?nameFilter=RAJ&accessRoles=OMIC_ADMIN&accessRoles=OMIC_USER&status=ACTIVE&caseload=MDI&activeCaseload=BXI&inclusiveRoles=true&showOnlyLSAs=true',
      )
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisUserSummaryWithEmail[]

      // call the function
      const actual = await nomisUsersAndRolesApi.downloadUserSearch(context, searchParams)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.downloadUserSearch(context, searchParams)).rejects.toThrow(error)
    })
  })

  describe('downloadLsaSearch', () => {
    const searchParams: UserSearchParams = {
      nameFilter: 'RAJ',
      accessRoles: ['OMIC_ADMIN', 'OMIC_USER'],
      status: 'ACTIVE',
      caseload: 'MDI',
      activeCaseload: 'BXI',
      inclusiveRoles: true,
      showOnlyLSAs: true,
    }
    const response: unknown = [
      {
        username: 'VQA73T',
        staffId: 402634,
        firstName: 'Aanathar',
        lastName: 'Aalasha',
        active: false,
        locked: false,
        expired: false,
        groups: [
          {
            id: 'BXI',
            name: 'Brixton',
          },
          {
            id: 'BXI',
            name: 'Brixton',
          },
        ],
      },
      {
        username: 'TQQ74V',
        staffId: 19232,
        firstName: 'Admdasa',
        lastName: 'Aalasha',
        active: true,
        locked: false,
        expired: false,
        groups: [
          {
            id: 'BXI',
            name: 'Brixton',
          },
        ],
      },
    ]

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.downloadLsaSearch(context, searchParams)

      // assert that the client was called with the correct parameters
      expect(client.get).toBeCalledWith(
        context,
        '/users/download/admins?nameFilter=RAJ&accessRoles=OMIC_ADMIN&accessRoles=OMIC_USER&status=ACTIVE&caseload=MDI&activeCaseload=BXI&inclusiveRoles=true&showOnlyLSAs=true',
      )
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisGroupAdminSummaryWithEmail[]

      // call the function
      const actual = await nomisUsersAndRolesApi.downloadLsaSearch(context, searchParams)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.downloadLsaSearch(context, searchParams)).rejects.toThrow(error)
    })
  })

  describe('getRoles', () => {
    const hasAdminRole = 'true'
    const response: unknown = [
      {
        code: 'OMIC_ADMIN',
        name: 'OMIC Admin',
        sequence: 1,
        adminRoleOnly: true,
      },
    ]

    beforeEach(() => {
      // mock the response from the client
      client.get = jest.fn().mockReturnValue({
        then: () => response,
      })
    })

    it('should call an endpoint with the correct parameters', async () => {
      // call the function
      await nomisUsersAndRolesApi.getRoles(context, hasAdminRole)

      // assert that the client was called with the correct parameters
      expect(client.get).toBeCalledWith(context, '/roles?admin-roles=true')
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisRoleDetail[]

      // call the function
      const actual = await nomisUsersAndRolesApi.getRoles(context, hasAdminRole)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.getRoles(context, hasAdminRole)).rejects.toThrow(error)
    })
  })

  describe('getCaseloads', () => {
    const response: unknown = [
      {
        id: 'BXI',
        name: 'Brixton',
      },
      {
        id: 'MDI',
        name: 'Moorland (HMP & YOI)',
      },
    ]

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.getCaseloads(context)

      // assert that the client was called with the correct parameters
      expect(client.get).toBeCalledWith(context, '/reference-data/caseloads')
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisPrisonCaseload[]

      // call the function
      const actual = await nomisUsersAndRolesApi.getCaseloads(context)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.getCaseloads(context)).rejects.toThrow(error)
    })
  })

  describe('currentUserCaseloads', () => {
    const user = 'TEST_USER'
    const response: unknown = [
      {
        id: 'BXI',
        name: 'Brixton',
      },
      {
        id: 'MDI',
        name: 'Moorland (HMP & YOI)',
      },
    ]

    beforeEach(() => {
      // mock the response from the client
      client.get = jest.fn().mockReturnValue({
        then: () => response,
      })
    })

    it('should call an endpoint with the correct parameters', async () => {
      // call the function
      await nomisUsersAndRolesApi.currentUserCaseloads(context, user)

      // assert that the client was called with the correct parameters
      expect(client.get).toBeCalledWith(context, `/users/${user}/caseloads`)
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisPrisonCaseload[]

      // call the function
      const actual = await nomisUsersAndRolesApi.currentUserCaseloads(context, user)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      const error: Error = new Error('An error occurred')

      // mock the client to return an error
      client.get = jest.fn().mockRejectedValue(error)

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.currentUserCaseloads(context, user)).rejects.toThrow(error)
    })
  })

  describe('getUser', () => {
    const user = 'TEST_USER'
    const response: unknown = {
      username: 'VQA73T',
      staffId: 402634,
      firstName: 'Aanathar',
      lastName: 'Aalasha',
      enabled: true,
      active: true,
      accountType: 'GENERAL',
      dpsRoleCodes: [],
    }

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.getUser(context, user)

      // assert that the client was called with the correct parameters
      expect(client.get).toBeCalledWith(context, `/users/${user}`)
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisUserDetail

      // call the function
      const actual = await nomisUsersAndRolesApi.getUser(context, user)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.getUser(context, user)).rejects.toThrow(error)
    })
  })

  describe('enableUser', () => {
    const user = { username: 'TEST_USER' }
    const response: unknown = {}

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.enableUser(context, user)

      // assert that the client was called with the correct parameters
      expect(client.put).toBeCalledWith(context, `/users/${user.username}/unlock-user`, {})
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.enableUser(context, user)).rejects.toThrow(error)
    })
  })

  describe('disableUser', () => {
    const user = { username: 'TEST_USER' }
    const response: unknown = {}

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.disableUser(context, user)

      // assert that the client was called with the correct parameters
      expect(client.put).toBeCalledWith(context, `/users/${user.username}/lock-user`, {})
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.enableUser(context, user)).rejects.toThrow(error)
    })
  })

  describe('addUserRole', () => {
    const user = { username: 'TEST_USER' }
    const roleCode = 'OMIC_ADMIN'
    const request: NomisUpdateRoleRequest = {}
    const response: unknown = {
      code: 'OMIC_ADMIN',
      name: 'OMIC Admin',
      sequence: 1,
      adminRoleOnly: true,
    }

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.addUserRole(context, user.username, roleCode, request)

      // assert that the client was called with the correct parameters
      expect(client.put).toBeCalledWith(context, `/users/${user.username}/roles/${roleCode}`, request)
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisRoleDetail

      // call the function
      const actual = await nomisUsersAndRolesApi.addUserRole(context, user.username, roleCode, request)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      // mock the client to return an error
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () =>
        nomisUsersAndRolesApi.addUserRole(context, user.username, roleCode, request),
      ).rejects.toThrow(error)
    })
  })

  describe('addUserRoles', () => {
    const user = { username: 'TEST_USER' }
    const roleCode = 'OMIC_ADMIN'
    const request: NomisCreateRoleRequest = {
      code: 'OMIC_ADMIN',
      name: 'OMIC Admin',
      adminRoleOnly: true,
      sequence: 1,
      type: 'APP',
    }
    const response: unknown = {
      code: 'OMIC_ADMIN',
      name: 'OMIC Admin',
      sequence: 1,
      adminRoleOnly: true,
    }

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.addUserRoles(context, user.username, request)

      // assert that the client was called with the correct parameters
      expect(client.post).toBeCalledWith(context, `/users/${user.username}/roles`, request)
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisRoleDetail

      // call the function
      const actual = await nomisUsersAndRolesApi.addUserRoles(context, user.username, request)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      // mock the client to return an error
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () =>
        nomisUsersAndRolesApi.addUserRole(context, user.username, roleCode, request),
      ).rejects.toThrow(error)
    })
  })

  describe('removeUserRole', () => {
    const user = { username: 'TEST_USER' }
    const roleCode = 'OMIC_ADMIN'
    const response: unknown = {}

    it('should call an endpoint with the correct parameters', async () => {
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.removeUserRole(context, user.username, roleCode)

      // assert that the client was called with the correct parameters
      expect(client.del).toBeCalledWith(context, `/users/${user.username}/roles/${roleCode}`)
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.removeUserRole(context, user.username, roleCode)).rejects.toThrow(
        error,
      )
    })
  })

  describe('getUserCaseloads', () => {
    const user = { username: 'TEST_USER' }
    const response: unknown = {
      username: 'TEST_USER',
      active: true,
      accountType: 'GENERAL',
      caseloads: [
        {
          id: 'BXI',
          name: 'Brixton',
        },
        {
          id: 'MDI',
          name: 'Moorland (HMP & YOI)',
        },
      ],
    }

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.getUserCaseloads(context, user.username)

      // assert that the client was called with the correct parameters
      expect(client.get).toBeCalledWith(context, `/users/${user.username}/caseloads`)
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected: NomisUserCaseloadDetail = response as NomisUserCaseloadDetail

      // call the function
      const actual = await nomisUsersAndRolesApi.getUserCaseloads(context, user.username)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      // mock the client to return an error
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () => nomisUsersAndRolesApi.getUserCaseloads(context, user.username)).rejects.toThrow(error)
    })
  })

  describe('addUserCaseloads', () => {
    const user = { username: 'TEST_USER' }
    const caseloads = ['BXI', 'MDI']
    const response: unknown = {
      username: 'TEST_USER',
      active: true,
      accountType: 'GENERAL',
      caseloads: [
        {
          id: 'BXI',
          name: 'Brixton',
        },
        {
          id: 'MDI',
          name: 'Moorland (HMP & YOI)',
        },
      ],
    }

    it('should call an endpoint with the correct parameters', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.addUserCaseloads(context, user.username, caseloads)

      // assert that the client was called with the correct parameters
      expect(client.post).toBeCalledWith(context, `/users/${user.username}/caseloads`, caseloads)
    })

    it('should return the correct response', async () => {
      // mock the response from the client
      mockResolvedValue(client, response)
      const expected = response as NomisUserCaseloadDetail

      // call the function
      const actual = await nomisUsersAndRolesApi.addUserCaseloads(context, user.username, caseloads)

      // assert that the response type is correct
      expect(typeof actual).toEqual(typeof expected)

      // assert that the response is correct
      expect(actual).toEqual(expected)
    })

    it('should throw an error response', async () => {
      // mock the client to return an error
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () =>
        nomisUsersAndRolesApi.addUserCaseloads(context, user.username, caseloads),
      ).rejects.toThrow(error)
    })
  })

  describe('removeUserCaseload', () => {
    const response: unknown = {}
    const user = { username: 'TEST_USER' }
    const caseloadId = 'BXI'

    it('should call an endpoint with the correct parameters', async () => {
      mockResolvedValue(client, response)

      // call the function
      await nomisUsersAndRolesApi.removeUserCaseload(context, user.username, caseloadId)

      // assert that the client was called with the correct parameters
      expect(client.del).toBeCalledWith(context, `/users/${user.username}/caseloads/${caseloadId}`)
    })

    it('should throw an error response', async () => {
      const error: Error = mockRejectedValue(client, new Error('An error occurred'))

      // assert that an error is thrown
      await expect(async () =>
        nomisUsersAndRolesApi.removeUserCaseload(context, user.username, caseloadId),
      ).rejects.toThrow(error)
    })
  })
})
