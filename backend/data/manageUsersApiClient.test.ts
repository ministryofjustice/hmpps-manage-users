import nock from 'nock'
import {
  PrisonUserDetails,
  Role,
  UserAllowlistAddRequest,
  UserAllowlistDetail,
  UserAllowlistPatchRequest,
} from '../@types/manageUsersApi'
import { ManageUsersApiClient } from './manageUsersApiClient'
import config from '../config'

describe('manageUsersApiClient', () => {
  let fakeManageUsersApi: nock.Scope
  let manageUsersApiClient: ManageUsersApiClient
  const token = 'TEST-TOKEN'
  beforeEach(() => {
    fakeManageUsersApi = nock(config.apis.manageUsers.url)
    manageUsersApiClient = new ManageUsersApiClient(token)
  })

  afterEach(() => {
    jest.resetAllMocks()
    nock.cleanAll()
  })
  describe('addAllowlistUser', () => {
    it('should call add allowlist user endpoint', async () => {
      fakeManageUsersApi.post('/users/allowlist').matchHeader('authorization', `Bearer ${token}`).reply(201)
      const request: UserAllowlistAddRequest = {
        username: 'AICIAD',
        email: 'anastazia.armistead@justice.gov.uk',
        firstName: 'Anastazia',
        lastName: 'Armistead',
        reason: 'For testing',
        accessPeriod: 'THREE_MONTHS',
      }
      await manageUsersApiClient.addAllowlistUser(request)
      expect(fakeManageUsersApi.isDone()).toBe(true)
    })
  })

  describe('updateAllowlistUserAccess', () => {
    it('should call add allowlist user endpoint', async () => {
      const id = '1d24a6e5-427e-4029-a964-fbc52122daee'
      fakeManageUsersApi.patch(`/users/allowlist/${id}`).matchHeader('authorization', `Bearer ${token}`).reply(200)
      const request: UserAllowlistPatchRequest = {
        reason: 'For testing again',
        accessPeriod: 'EXPIRE',
      }
      await manageUsersApiClient.updateAllowlistUserAccess(id, request)
      expect(fakeManageUsersApi.isDone()).toBe(true)
    })
  })

  describe('getAllAllowlistUsers', () => {
    const allowlistUsersResponse = {
      content: [
        {
          id: '7dd658d9-8918-4650-9555-2df4b89e0d15',
          username: 'AICIAD',
          email: 'anastazia.armistead@justice.gov.uk',
          firstName: 'Anastazia',
          lastName: 'Armistead',
          reason: 'For testing',
          createdOn: `${new Date('2024-03-19T04:39:08')}`,
          allowlistEndDate: `${new Date('2025-03-19')}`,
          lastUpdated: `${new Date('2024-03-19T04:39:08')}`,
          lastUpdatedBy: 'LAQUINAQNW',
        },
        {
          id: '7dd658d9-8918-4650-9555-2df4b89e0d15',
          username: 'ZAFIRAHT9YH',
          email: 'litany.storm@justice.gov.uk',
          firstName: 'Litany',
          lastName: 'Storm',
          reason: 'For testing',
          createdOn: `${new Date('2025-03-19T04:39:08')}`,
          allowlistEndDate: `${new Date('2025-06-19')}`,
          lastUpdated: `${new Date('2025-03-19T04:39:08')}`,
          lastUpdatedBy: 'ZAIRAKB',
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
      totalPages: 1,
      totalElements: 2,
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

    it('should call get allow list users endpoint passing request parameters', async () => {
      const query = {
        name: 'RAJ',
        status: 'EXPIRED',
        size: 30,
        page: 3,
      }
      fakeManageUsersApi
        .get('/users/allowlist')
        .matchHeader('authorization', `Bearer ${token}`)
        .query(query)
        .reply(200, allowlistUsersResponse)
      const actual = await manageUsersApiClient.getAllAllowlistUsers(query)
      expect(fakeManageUsersApi.isDone()).toBe(true)
      expect(actual).toEqual(allowlistUsersResponse)
    })
    it('should call get allow list users endpoint with default parameters', async () => {
      const defaultQuery = {
        status: 'ALL',
        size: 20,
        page: 0,
      }
      fakeManageUsersApi
        .get('/users/allowlist')
        .matchHeader('authorization', `Bearer ${token}`)
        .query(defaultQuery)
        .reply(200, allowlistUsersResponse)
      const actual = await manageUsersApiClient.getAllAllowlistUsers()
      expect(fakeManageUsersApi.isDone()).toBe(true)
      expect(actual).toEqual(allowlistUsersResponse)
    })
  })

  describe('getAllowlistUser', () => {
    const username = 'AICIAD'
    const allowlistUserResponse: UserAllowlistDetail = {
      id: '7dd658d9-8918-4650-9555-2df4b89e0d15',
      username,
      email: 'anastazia.armistead@justice.gov.uk',
      firstName: 'Anastazia',
      lastName: 'Armistead',
      reason: 'For testing',
      createdOn: `${new Date('2024-03-19T04:39:08')}`,
      allowlistEndDate: `${new Date('2025-03-19')}`,
      lastUpdated: `${new Date('2024-03-19T04:39:08')}`,
      lastUpdatedBy: 'LAQUINAQNW',
    }

    it('should call get allow list user endpoint', async () => {
      fakeManageUsersApi
        .get(`/users/allowlist/${username}`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, allowlistUserResponse)
      const actual = await manageUsersApiClient.getAllowlistUser(username)
      expect(fakeManageUsersApi.isDone()).toBe(true)
      expect(actual).toEqual(allowlistUserResponse)
    })
  })

  describe('getRoles', () => {
    const rolesResponse: Role[] = [
      {
        roleCode: 'TEST_ROLE_MULTI_ADMIN',
        roleName: 'Test Role Multi Admin',
        roleDescription: 'Multiple admin role for tests',
        adminType: [
          {
            adminTypeCode: 'DPS_ADM',
            adminTypeName: 'DPS Central Administrator',
          },
          {
            adminTypeCode: 'DPS_LSA',
            adminTypeName: 'Local Administrator',
          },
        ],
      },
      {
        roleCode: 'TEST_ROLE_SINGLE_ADMIN',
        roleName: 'Test Role Single Admin',
        roleDescription: 'Single admin role for tests',
        adminType: [
          {
            adminTypeCode: 'DPS_ADM',
            adminTypeName: 'DPS Central Administrator',
          },
        ],
      },
    ]
    it('should call get roles endpoint', async () => {
      fakeManageUsersApi
        .get(`/roles?adminTypes=DPS_ADM`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, rolesResponse)
      const actual = await manageUsersApiClient.getRoles('DPS_ADM')
      expect(fakeManageUsersApi.isDone()).toBe(true)
      expect(actual).toEqual(rolesResponse)
    })
  })

  describe('getDpsUser', () => {
    const dpsUserResponse: PrisonUserDetails = {
      accountType: 'ADMIN',
      active: false,
      authSource: 'nomis',
      enabled: false,
      firstName: 'Test',
      lastName: 'LSA Admin',
      name: 'Test LSA Admin',
      staffId: 12345,
      userId: 67890,
      username: 'TADMIN_LSA',
      administratorOfUserGroups: [
        {
          id: 'DMI',
          name: 'DURHAM (HMP) LAA',
        },
      ],
    }
    it('should call get prison user details endpoint', async () => {
      fakeManageUsersApi
        .get(`/prisonusers/${dpsUserResponse.username}/details`)
        .matchHeader('authorization', `Bearer ${token}`)
        .reply(200, dpsUserResponse)
      const actual = await manageUsersApiClient.getDpsUser('TADMIN_LSA')
      expect(fakeManageUsersApi.isDone()).toBe(true)
      expect(actual).toEqual(dpsUserResponse)
    })
  })
})
