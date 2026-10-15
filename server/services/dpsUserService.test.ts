import { Response } from 'superagent'
import {
  CreateUserRequest,
  PagedList,
  PrisonAdminUserSummary,
  PrisonCaseload,
  PrisonStaffNewUser,
  PrisonUserDetails,
  PrisonUserDownloadSummary,
  PrisonUserSearchSummary,
  UserCaseloadDetail,
  UserRoleDetail,
} from 'manageUsersApiClient'
import DpsUserService from './dpsUserService'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { CreateLinkedDpsUserRequest } from '../interfaces/createLinkedDpsUserRequest'

jest.mock('../data/manageUsersApiClient')

describe('DpsUserService', () => {
  let apiClient: jest.Mocked<ManageUsersApiClient>
  let service: DpsUserService

  beforeEach(() => {
    apiClient = {
      createUser: jest.fn(),
      getCaseloads: jest.fn(),
      getDpsUser: jest.fn(),
      createLinkedCentralAdminUser: jest.fn(),
      createLinkedLsaUser: jest.fn(),
      createLinkedGeneralUser: jest.fn(),
      dpsUserSearch: jest.fn(),
      downloadUserSearch: jest.fn(),
      downloadLsaSearch: jest.fn(),
      addDpsUserRoles: jest.fn(),
      getDpsUserRoles: jest.fn(),
      removeDpsUserRole: jest.fn(),
      syncDpsEmail: jest.fn(),
      changeDpsEmail: jest.fn(),
      enablePrisonUser: jest.fn(),
      disablePrisonUser: jest.fn(),
      addUserCaseloads: jest.fn(),
      getUserCaseloads: jest.fn(),
      removeUserCaseload: jest.fn(),
    } as unknown as jest.Mocked<ManageUsersApiClient>

    service = new DpsUserService(apiClient)
  })

  const token = 'test-token'

  it('creates a DPS user', async () => {
    const request = { username: 'new-user' } as CreateUserRequest
    const response = { username: 'new-user' } as PrisonStaffNewUser

    apiClient.createUser.mockResolvedValue(response)

    const result = await service.createDpsUser(token, request)

    expect(apiClient.createUser).toHaveBeenCalledWith(token, request)
    expect(result).toBe(response)
  })

  it('gets caseloads', async () => {
    const caseloads: PrisonCaseload[] = [{ id: 'MDI', name: 'Moorland' }]

    apiClient.getCaseloads.mockResolvedValue(caseloads)

    const result = await service.getCaseloads(token)

    expect(apiClient.getCaseloads).toHaveBeenCalledWith(token)
    expect(result).toBe(caseloads)
  })

  it('adds caseloads', async () => {
    const userCaseloadDetail: UserCaseloadDetail = {
      username: 'some-user',
      active: true,
      accountType: 'GENERAL',
      caseloads: [
        { id: 'MDI', name: 'Moorland' },
        { id: 'LEI', name: 'Leeds (HMP)' },
      ],
    }

    apiClient.addUserCaseloads.mockResolvedValue(userCaseloadDetail)

    const result = await service.addCaseloads(token, 'some-user', ['LEI'])

    expect(apiClient.addUserCaseloads).toHaveBeenCalledWith(token, 'some-user', ['LEI'])
    expect(result).toBe(userCaseloadDetail)
  })

  it('gets user caseloads', async () => {
    const userCaseloadDetail: UserCaseloadDetail = {
      username: 'some-user',
      active: true,
      accountType: 'GENERAL',
      caseloads: [
        { id: 'MDI', name: 'Moorland' },
        { id: 'LEI', name: 'Leeds (HMP)' },
      ],
    }

    apiClient.getUserCaseloads.mockResolvedValue(userCaseloadDetail)

    const result = await service.getUserCaseloads(token, 'some-user')

    expect(apiClient.getUserCaseloads).toHaveBeenCalledWith(token, 'some-user')
    expect(result).toBe(userCaseloadDetail)
  })

  it('removes a user caseload', async () => {
    const userCaseloadDetail: UserCaseloadDetail = {
      username: 'some-user',
      active: true,
      accountType: 'GENERAL',
      caseloads: [{ id: 'MDI', name: 'Moorland' }],
    }

    apiClient.removeUserCaseload.mockResolvedValue(userCaseloadDetail)

    const result = await service.removeCaseload(token, 'some-user', 'LEI')

    expect(apiClient.removeUserCaseload).toHaveBeenCalledWith(token, 'some-user', 'LEI')
    expect(result).toBe(userCaseloadDetail)
  })

  it('gets a DPS user', async () => {
    const user: PrisonUserDetails = { username: 'some-user' } as PrisonUserDetails

    apiClient.getDpsUser.mockResolvedValue(user)

    const result = await service.getDpsUser(token, 'some-user')

    expect(apiClient.getDpsUser).toHaveBeenCalledWith(token, 'some-user')
    expect(result).toBe(user)
  })

  it('gets a DPS user and syncs email beforehand', async () => {
    const user: PrisonUserDetails = { username: 'some-user' } as PrisonUserDetails

    apiClient.getDpsUser.mockResolvedValue(user)

    const result = await service.getDpsUser(token, 'some-user', true)

    expect(apiClient.syncDpsEmail).toHaveBeenCalledWith(token, 'some-user')
    expect(apiClient.getDpsUser).toHaveBeenCalledWith(token, 'some-user')
    expect(result).toBe(user)
  })

  it('searches dps users', async () => {
    const users = {
      content: [
        {
          username: `ITAG_USER`,
          staffId: 1,
          firstName: 'Itag',
          lastName: `User`,
          active: true,
          status: 'OPEN',
          locked: false,
          expired: false,
          lastLogonDate: '2023-12-25T12:57:50',
          activeCaseload: {
            id: 'BXI',
            name: 'Brixton (HMP)',
          },
          dpsRoleCount: 1,
          email: `ITAG_USER@gov.uk`,
          staffStatus: 'ACTIVE',
        },
      ],
      size: 10,
      totalElements: 1,
      number: 0,
      numberOfElements: 1,
    } as PagedList<PrisonUserSearchSummary>

    apiClient.dpsUserSearch.mockResolvedValue(users)

    const result = await service.dpsUserSearch(token, { nameFilter: 'ITAG', size: 10, page: 0 })

    expect(apiClient.dpsUserSearch).toHaveBeenCalledWith(token, { nameFilter: 'ITAG', size: 10, page: 0 })
    expect(result).toBe(users)
  })

  it('downloads dps users', async () => {
    const users: PrisonUserDownloadSummary = [
      {
        username: 'ITAG_USER',
        staffId: '12345',
        firstName: 'Test',
        lastName: 'User',
        active: true,
      },
    ]

    apiClient.downloadUserSearch.mockResolvedValue(users)

    const result = await service.downloadUserSearch(token, { nameFilter: 'ITAG', size: 10, page: 0 })

    expect(apiClient.downloadUserSearch).toHaveBeenCalledWith(token, { nameFilter: 'ITAG', size: 10, page: 0 })
    expect(result).toBe(users)
  })

  it('downloads dps lsa admins', async () => {
    const users: PrisonAdminUserSummary = [
      {
        username: 'ITAG_USER',
        staffId: '12345',
        firstName: 'Test',
        lastName: 'User',
        active: true,
        locked: false,
        expired: false,
        dpsRoleCount: 1,
        groups: [
          {
            id: 'TEST_GROUP',
            name: 'Test Group',
          },
        ],
      },
    ]

    apiClient.downloadLsaSearch.mockResolvedValue(users)

    const result = await service.downloadLsaSearch(token, { nameFilter: 'ITAG', size: 10, page: 0 })

    expect(apiClient.downloadLsaSearch).toHaveBeenCalledWith(token, { nameFilter: 'ITAG', size: 10, page: 0 })
    expect(result).toBe(users)
  })

  const createLinkedDpsUserRequest = (
    userType: string,
    existingUsername: string,
    username: string,
  ): CreateLinkedDpsUserRequest => {
    return {
      userType,
      existingUsername,
      username,
      createUser: '',
      searchUser: '',
      defaultCaseloadId: 'MDI',
      firstName: 'Test',
      lastName: 'User',
      email: 'test.user@justice.gov.uk',
    }
  }

  it('creates a linked central admin user when userType = DPS_ADM', async () => {
    const request: CreateLinkedDpsUserRequest = createLinkedDpsUserRequest('DPS_ADM', 'existing-admin', 'new-admin')

    apiClient.createLinkedCentralAdminUser.mockResolvedValue({
      adminAccount: { username: 'new-admin' },
    })

    const result = await service.createLinkedDpsUser(token, request)

    expect(apiClient.createLinkedCentralAdminUser).toHaveBeenCalledWith(token, {
      existingUsername: 'existing-admin',
      adminUsername: 'new-admin',
    })

    expect(result).toBe('new-admin')
  })

  it('creates a linked LSA user when userType = DPS_LSA', async () => {
    const request = createLinkedDpsUserRequest('DPS_LSA', 'existing-lsa', 'new-lsa')

    apiClient.createLinkedLsaUser.mockResolvedValue({
      adminAccount: { username: 'new-lsa' },
    })

    const result = await service.createLinkedDpsUser(token, request)

    expect(apiClient.createLinkedLsaUser).toHaveBeenCalledWith(token, {
      existingUsername: 'existing-lsa',
      adminUsername: 'new-lsa',
      localAdminGroup: 'MDI',
    })

    expect(result).toBe('new-lsa')
  })

  it('creates a linked general user when userType = DPS_GEN', async () => {
    const request = createLinkedDpsUserRequest('DPS_GEN', 'existing-gen', 'new-gen')

    apiClient.createLinkedGeneralUser.mockResolvedValue({
      generalAccount: { username: 'new-gen' },
    })

    const result = await service.createLinkedDpsUser(token, request)

    expect(apiClient.createLinkedGeneralUser).toHaveBeenCalledWith(token, {
      existingAdminUsername: 'existing-gen',
      generalUsername: 'new-gen',
      defaultCaseloadId: 'MDI',
    })

    expect(result).toBe('new-gen')
  })

  it('adds user roles', async () => {
    const userRoleDetail: UserRoleDetail = {
      username: 'some-user',
      active: true,
      accountType: 'GENERAL',
      dpsRoles: [
        { code: 'ROLE_TEST', name: 'Test role' },
        { code: 'ROLE_ADMIN_TEST', name: 'Test admin role' },
      ],
    }

    apiClient.addDpsUserRoles.mockResolvedValue(userRoleDetail)

    const result = await service.addRoles(token, 'some-user', ['ROLE_TEST'])

    expect(apiClient.addDpsUserRoles).toHaveBeenCalledWith(token, 'some-user', ['ROLE_TEST'])
    expect(result).toBe(userRoleDetail)
  })

  it('gets user roles', async () => {
    const userRoleDetail: UserRoleDetail = {
      username: 'some-user',
      active: true,
      accountType: 'GENERAL',
      dpsRoles: [
        { code: 'ROLE_TEST', name: 'Test role' },
        { code: 'ROLE_ADMIN_TEST', name: 'Test admin role' },
      ],
    }

    apiClient.getDpsUserRoles.mockResolvedValue(userRoleDetail)

    const result = await service.getRoles(token, 'some-user')

    expect(apiClient.getDpsUserRoles).toHaveBeenCalledWith(token, 'some-user')
    expect(result).toBe(userRoleDetail)
  })

  it('removes a user role', async () => {
    const userRoleDetail: UserRoleDetail = {
      username: 'some-user',
      active: true,
      accountType: 'GENERAL',
      dpsRoles: [{ code: 'ROLE_TEST', name: 'Test role' }],
    }

    apiClient.removeDpsUserRole.mockResolvedValue(userRoleDetail)

    const result = await service.removeRole(token, 'some-user', 'ROLE_ADMIN_TEST')

    expect(apiClient.removeDpsUserRole).toHaveBeenCalledWith(token, 'some-user', 'ROLE_ADMIN_TEST')
    expect(result).toBe(userRoleDetail)
  })

  it('syncs a users email', async () => {
    const response = {
      ok: true,
    } as Response

    apiClient.syncDpsEmail.mockResolvedValue(response)

    const result = await service.syncEmail(token, 'some-user')

    expect(apiClient.syncDpsEmail).toHaveBeenCalledWith(token, 'some-user')
    expect(result).toBe(response)
  })

  it('changes a users email', async () => {
    const newEmail = 'newEmail@justice.gov.uk'

    apiClient.changeDpsEmail.mockResolvedValue(newEmail)

    const result = await service.changeEmail(token, 'some-user', newEmail)

    expect(apiClient.changeDpsEmail).toHaveBeenCalledWith(token, 'some-user', newEmail)
    expect(result).toBe(newEmail)
  })

  it('enables a user', async () => {
    const response = {
      ok: true,
    } as Response

    apiClient.enablePrisonUser.mockResolvedValue(response)

    const result = await service.enableUser(token, 'some-user')

    expect(apiClient.enablePrisonUser).toHaveBeenCalledWith(token, 'some-user')
    expect(result).toBe(response)
  })

  it('disables a user', async () => {
    const response = {
      ok: true,
    } as Response

    apiClient.disablePrisonUser.mockResolvedValue(response)

    const result = await service.disableUser(token, 'some-user')

    expect(apiClient.disablePrisonUser).toHaveBeenCalledWith(token, 'some-user')
    expect(result).toBe(response)
  })
})
