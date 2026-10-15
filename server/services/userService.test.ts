import ManageUsersApiClient from '../data/manageUsersApiClient'
import UserService from './userService'

jest.mock('../data/manageUsersApiClient')

describe('UserService', () => {
  let apiClient: jest.Mocked<ManageUsersApiClient>
  let service: UserService

  beforeEach(() => {
    apiClient = {
      getUserEmail: jest.fn(),
    } as unknown as jest.Mocked<ManageUsersApiClient>

    service = new UserService(apiClient)
  })

  const token = 'test-token'

  it('gets user email', async () => {
    const email = {
      username: 'some-user',
      email: 'someUser@justice.gov.uk',
      verified: true,
    }

    apiClient.getUserEmail.mockResolvedValue(email)

    const result = await service.getUserEmail(token, 'some-user')

    expect(apiClient.getUserEmail).toHaveBeenCalledWith(token, 'some-user')
    expect(result).toBe(email)
  })
})
