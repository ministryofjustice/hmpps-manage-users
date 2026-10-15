import { CreateExternalUserRequest, ExternalUser, PagedList, UserGroup } from 'manageUsersApiClient'
import { Response } from 'superagent'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import ExternalUserService from './externalUserService'
import { ExternalUser as HmppsExternalUser } from '../interfaces/hmppsUser'

jest.mock('../data/manageUsersApiClient')

describe('ExternalUserService', () => {
  let apiClient: jest.Mocked<ManageUsersApiClient>
  let service: ExternalUserService

  beforeEach(() => {
    apiClient = {
      assignableGroups: jest.fn(),
      getUsersInCRSGroup: jest.fn(),
      createExternalUser: jest.fn(),
      userSearch: jest.fn(),
      getUser: jest.fn(),
      externalUserRoles: jest.fn(),
      userGroups: jest.fn(),
      assignableRoles: jest.fn(),
      searchableRoles: jest.fn(),
      externalUserAddRoles: jest.fn(),
      deleteExternalUserRole: jest.fn(),
      addUserGroup: jest.fn(),
      removeUserGroup: jest.fn(),
      amendUserEmail: jest.fn(),
      enableExternalUser: jest.fn(),
      disableExternalUser: jest.fn(),
      deactivateExternalUser: jest.fn(),
    } as unknown as jest.Mocked<ManageUsersApiClient>

    service = new ExternalUserService(apiClient)
  })

  const token = 'test-token'

  it('Gets assignable groups', async () => {
    const response: UserGroup[] = [
      { groupCode: 'SOC_NORTH_WEST', groupName: 'SOCU North West' },
      { groupCode: 'PECS_TVP', groupName: 'PECS Police Force Thames Valley' },
      { groupCode: 'PECS_SOUTBC', groupName: 'PECS Court Southend Combined Court' },
      { groupCode: 'SITE_1_GROUP_2', groupName: 'Site 1 - Group 2' },
    ]

    apiClient.assignableGroups.mockResolvedValue(response)

    const result = await service.assignableGroups(token)

    expect(apiClient.assignableGroups).toHaveBeenCalledWith(token)
    expect(result).toBe(response)
  })

  it('Gets users in CRS Group', async () => {
    const response: ExternalUser[] = [
      {
        userId: 'a0b224bf-f499-48cf-9eed-1a9a0066dde1',
        username: 'test@justice.gov.uk',
        email: 'test@justice.gov.uk',
        firstName: 'Test',
        lastName: 'User',
        locked: false,
        enabled: true,
        verified: true,
      },
    ]

    apiClient.getUsersInCRSGroup.mockResolvedValue(response)

    const result = await service.getUsersInCRSGroup(token, 'CRS_TEST_GROUP')

    expect(apiClient.getUsersInCRSGroup).toHaveBeenCalledWith(token, 'CRS_TEST_GROUP')
    expect(result).toBe(response)
  })

  it('Creates an external user', async () => {
    const user = { email: 'test@justice.gov.uk' } as CreateExternalUserRequest
    apiClient.createExternalUser.mockResolvedValue('new-user-id')

    const result = await service.createExternalUser(token, user)

    expect(apiClient.createExternalUser).toHaveBeenCalledWith(token, user)
    expect(result).toBe('new-user-id')
  })

  it('Searches users', async () => {
    const filter = { nameFilter: 'test', role: 'ROLE_X', group: 'GROUP_X', status: 'ACTIVE' }

    const users = {
      content: [
        {
          userId: '39ed5ea0-3397-44da-8b2f-081e7f0e85a8',
          email: 'test.user@justice.gov.uk',
          username: 'test.user@justice.gov.uk',
          firstName: 'Test',
          lastName: 'User',
          locked: false,
          enabled: true,
          verified: true,
          lastLoggedIn: '2023-12-25T12:57:50',
          inactiveReason: 'None',
        },
      ],
      size: 10,
      totalElements: 1,
      number: 0,
      numberOfElements: 1,
    } as PagedList<ExternalUser>
    apiClient.userSearch.mockResolvedValue(users)

    const result = await service.searchUsers(token, filter, 1, 25)

    expect(apiClient.userSearch).toHaveBeenCalledWith(token, filter, 1, 25)
    expect(result).toBe(users)
  })

  it('Gets external user details', async () => {
    const response = {
      userId: 'user-id',
      username: 'test@justice.gov.uk',
      email: 'test@justice.gov.uk',
      firstName: 'Test',
      lastName: 'User',
      locked: false,
      enabled: true,
      verified: true,
    } as ExternalUser
    apiClient.getUser.mockResolvedValue(response)

    const result = await service.getUser(token, 'user-id')

    expect(apiClient.getUser).toHaveBeenCalledWith(token, 'user-id')
    expect(result).toBe(response)
  })

  it('Gets external user roles', async () => {
    const response = [{ roleCode: 'ROLE_X', roleName: 'Role X', roleDescription: 'Role X' }]
    apiClient.externalUserRoles.mockResolvedValue(response)

    const result = await service.getUserRoles(token, 'user-id')

    expect(apiClient.externalUserRoles).toHaveBeenCalledWith(token, 'user-id')
    expect(result).toBe(response)
  })

  it('Gets external user groups', async () => {
    const response: UserGroup[] = [{ groupCode: 'GROUP_X', groupName: 'Group X' }]
    apiClient.userGroups.mockResolvedValue(response)

    const result = await service.getUserGroups(token, 'user-id')

    expect(apiClient.userGroups).toHaveBeenCalledWith(token, 'user-id')
    expect(result).toBe(response)
  })

  it('Gets assignable roles for user including OAUTH_ADMIN if has role OAUTH_ADMIN', async () => {
    const user: HmppsExternalUser = {
      username: 'some-user',
      authSource: 'external',
      userId: '1234',
      userUuid: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Some User',
      displayName: 'S. User',
      userRoles: ['MAINTAIN_ACCESS_ROLES_ADMIN', 'OAUTH_ADMIN'],
      token,
    }

    const roles = [
      {
        roleCode: 'ROLE_TEST',
        roleName: 'Test role',
        roleDescription: 'Test role to allow this test to pass',
      },
      {
        roleCode: 'OAUTH_ADMIN',
        roleName: 'OAuth admin',
        roleDescription: 'Manages oauth client details',
      },
    ]
    apiClient.assignableRoles.mockResolvedValue(roles)

    const result = await service.getAssignableRoles(user, 'user-id')

    expect(apiClient.assignableRoles).toHaveBeenCalledWith(token, 'user-id')
    expect(result).toBe(roles)
  })

  it('Gets assignable roles for user excluding OAUTH_ADMIN if does not have role OAUTH_ADMIN', async () => {
    const user: HmppsExternalUser = {
      username: 'some-user',
      authSource: 'external',
      userId: '1234',
      userUuid: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Some User',
      displayName: 'S. User',
      userRoles: ['MAINTAIN_ACCESS_ROLES_ADMIN'],
      token,
    }

    const roles = [
      {
        roleCode: 'ROLE_TEST',
        roleName: 'Test role',
        roleDescription: 'Test role to allow this test to pass',
      },
      {
        roleCode: 'OAUTH_ADMIN',
        roleName: 'OAuth admin',
        roleDescription: 'Manages oauth client details',
      },
    ]

    const expectedRoles = [
      {
        roleCode: 'ROLE_TEST',
        roleName: 'Test role',
        roleDescription: 'Test role to allow this test to pass',
      },
    ]
    apiClient.assignableRoles.mockResolvedValue(roles)

    const result = await service.getAssignableRoles(user, 'user-id')

    expect(apiClient.assignableRoles).toHaveBeenCalledWith(token, 'user-id')
    expect(result).toStrictEqual(expectedRoles)
  })

  it('Gets searchable roles', async () => {
    const response = [{ roleCode: 'ROLE_Z', roleName: 'Role Z', roleDescription: 'Role Z' }]
    apiClient.searchableRoles.mockResolvedValue(response)

    const result = await service.getSearchableRoles(token)

    expect(apiClient.searchableRoles).toHaveBeenCalledWith(token)
    expect(result).toBe(response)
  })

  it('Adds roles to external user', async () => {
    const response = {
      ok: true,
    } as Response

    apiClient.externalUserAddRoles.mockResolvedValue(response)

    await service.addRoles(token, 'user-id', ['ROLE_A', 'ROLE_B'])

    expect(apiClient.externalUserAddRoles).toHaveBeenCalledWith(token, 'user-id', ['ROLE_A', 'ROLE_B'])
  })

  it('Removes a role from external user', async () => {
    const response = {
      ok: true,
    } as Response
    apiClient.deleteExternalUserRole.mockResolvedValue(response)

    await service.removeRole(token, 'user-id', 'ROLE_A')

    expect(apiClient.deleteExternalUserRole).toHaveBeenCalledWith(token, 'user-id', 'ROLE_A')
  })

  it('Adds a group to external user', async () => {
    const response = {
      ok: true,
    } as Response
    apiClient.addUserGroup.mockResolvedValue(response)

    await service.addGroup(token, 'user-id', 'GROUP_A')

    expect(apiClient.addUserGroup).toHaveBeenCalledWith(token, 'user-id', 'GROUP_A')
  })

  it('Removes a group from external user', async () => {
    const response = {
      ok: true,
    } as Response
    apiClient.removeUserGroup.mockResolvedValue(response)

    await service.removeGroup(token, 'user-id', 'GROUP_A')

    expect(apiClient.removeUserGroup).toHaveBeenCalledWith(token, 'user-id', 'GROUP_A')
  })

  it('Changes external user email', async () => {
    const response = {
      ok: true,
    } as Response
    apiClient.amendUserEmail.mockResolvedValue(response)

    await service.changeEmail(token, 'user-id', 'new.email@justice.gov.uk')

    expect(apiClient.amendUserEmail).toHaveBeenCalledWith(token, 'user-id', { email: 'new.email@justice.gov.uk' })
  })

  it('Enables external user', async () => {
    const response = {
      ok: true,
    } as Response
    apiClient.enableExternalUser.mockResolvedValue(response)

    await service.enableUser(token, 'user-id')

    expect(apiClient.enableExternalUser).toHaveBeenCalledWith(token, 'user-id')
  })

  it('Disables external user', async () => {
    const response = {
      ok: true,
    } as Response
    apiClient.disableExternalUser.mockResolvedValue(response)

    await service.disableUser(token, 'user-id')

    expect(apiClient.disableExternalUser).toHaveBeenCalledWith(token, 'user-id')
  })

  it('Deactivates external user with reason', async () => {
    const response = {
      ok: true,
    } as Response
    apiClient.deactivateExternalUser.mockResolvedValue(response)

    await service.deactivateUser(token, 'user-id', 'Duplicate account')

    expect(apiClient.deactivateExternalUser).toHaveBeenCalledWith(token, 'user-id', 'Duplicate account')
  })
})
