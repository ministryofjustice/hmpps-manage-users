import { UserAllowlistAddRequest, UserAllowlistDetail, UserAllowlistPatchRequest } from 'manageUsersApiClient'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import UserAllowListService from './userAllowListService'

jest.mock('../data/manageUsersApiClient')

describe('UserAllowListService', () => {
  let apiClient: jest.Mocked<ManageUsersApiClient>
  let service: UserAllowListService

  beforeEach(() => {
    apiClient = {
      getAllowlistUser: jest.fn(),
      getAllAllowlistUsers: jest.fn(),
      addAllowlistUser: jest.fn(),
      updateAllowlistUserAccess: jest.fn(),
    } as unknown as jest.Mocked<ManageUsersApiClient>

    service = new UserAllowListService(apiClient)
  })

  const token = 'test-token'
  const testId = 'a073bfc1-2f81-4b6d-9b9c-fd7c367fe4c7'
  const allowlistUser: UserAllowlistDetail = {
    id: testId,
    username: 'TUSER_GEN',
    email: 'test.user@justice.gov.uk',
    firstName: 'Test',
    lastName: 'User',
    reason: 'For testing purposes',
    createdOn: '2024-03-19T04:39:08',
    allowlistEndDate: '2024-04-19',
    lastUpdated: '2024-03-19T04:39:08',
    lastUpdatedBy: 'ADMIN',
  }

  describe('getAllowListUser', () => {
    it('returns the user from the API', async () => {
      apiClient.getAllowlistUser.mockResolvedValue(allowlistUser)

      const result = await service.getAllowListUser(token, 'TUSER_GEN')

      expect(apiClient.getAllowlistUser).toHaveBeenCalledWith(token, 'TUSER_GEN')
      expect(result).toBe(allowlistUser)
    })
  })

  describe('usernameExists', () => {
    it('returns true when the user is found', async () => {
      apiClient.getAllowlistUser.mockResolvedValue(allowlistUser)

      const result = await service.usernameExists(token, 'TUSER_GEN')

      expect(apiClient.getAllowlistUser).toHaveBeenCalledWith(token, 'TUSER_GEN')
      expect(result).toBe(true)
    })

    it('returns false when the API throws (user not found)', async () => {
      apiClient.getAllowlistUser.mockRejectedValue({ responseStatus: 404 })

      const result = await service.usernameExists(token, 'UNKNOWN_USER')

      expect(apiClient.getAllowlistUser).toHaveBeenCalledWith(token, 'UNKNOWN_USER')
      expect(result).toBe(false)
    })
  })

  describe('addAllowListUser', () => {
    it('calls the API with the provided user request', async () => {
      const request: UserAllowlistAddRequest = {
        username: 'TUSER_GEN',
        email: 'test.user@justice.gov.uk',
        firstName: 'Test',
        lastName: 'User',
        reason: 'For testing purposes',
        accessPeriod: 'ONE_MONTH',
      }
      apiClient.addAllowlistUser.mockResolvedValue({} as never)

      await service.addAllowListUser(token, request)

      expect(apiClient.addAllowlistUser).toHaveBeenCalledWith(token, request)
    })
  })

  describe('getAllAllowListUsers', () => {
    it('calls the API with the provided query', async () => {
      apiClient.getAllAllowlistUsers.mockResolvedValue({} as never)

      await service.getAllAllowListUsers(token, { status: 'ACTIVE', page: 1, size: 20 })

      expect(apiClient.getAllAllowlistUsers).toHaveBeenCalledWith(token, { status: 'ACTIVE', page: 1, size: 20 })
    })
  })

  describe('updateAllowListUserAccess', () => {
    it('calls the API with the provided request', async () => {
      const request: UserAllowlistPatchRequest = {
        reason: 'Updated reason',
        accessPeriod: 'SIX_MONTHS',
      }
      apiClient.updateAllowlistUserAccess.mockResolvedValue({} as never)

      await service.updateAllowListUserAccess(token, testId, request)

      expect(apiClient.updateAllowlistUserAccess).toHaveBeenCalledWith(token, testId, request)
    })
  })
})
