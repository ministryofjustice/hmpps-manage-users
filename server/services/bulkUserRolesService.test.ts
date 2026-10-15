import {
  BulkUserRoleAdditionsJobDetails,
  BulkUserRoleAdditionsJobSummary,
  PagedList,
  UserRole,
} from 'manageUsersApiClient'
import { Response } from 'superagent'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import BulkUserRolesService from './bulkUserRolesService'
import CsvValidationError from './csvValidationError'

jest.mock('../data/manageUsersApiClient')

describe('BulkUserRolesService', () => {
  let apiClient: jest.Mocked<ManageUsersApiClient>
  let service: BulkUserRolesService

  beforeEach(() => {
    apiClient = {
      searchableRoles: jest.fn(),
      getBulkUserRoleAdditionsJobs: jest.fn(),
      getBulkUserRoleAdditionsJob: jest.fn(),
      downloadBulkUserRoleAdditionsJobCsv: jest.fn(),
      createBulkUserRoleAdditionsJob: jest.fn(),
    } as unknown as jest.Mocked<ManageUsersApiClient>

    service = new BulkUserRolesService(apiClient)
  })

  const token = 'test-token'

  const csvFile = (content: string): Express.Multer.File =>
    ({
      originalname: 'users.csv',
      buffer: Buffer.from(content),
    }) as Express.Multer.File

  describe('getSelectableRoles', () => {
    it('delegates to the api client', async () => {
      const response: UserRole[] = [{ roleCode: 'ROLE_1', roleName: 'Role 1', roleDescription: 'Role 1 description' }]
      apiClient.searchableRoles.mockResolvedValue(response)

      const result = await service.getSelectableRoles(token)

      expect(apiClient.searchableRoles).toHaveBeenCalledWith(token)
      expect(result).toBe(response)
    })
  })

  describe('getBulkUserRoleAdditionsJobs', () => {
    it('delegates to the api client', async () => {
      const response = { content: [], totalElements: 0 } as unknown as PagedList<BulkUserRoleAdditionsJobSummary>
      apiClient.getBulkUserRoleAdditionsJobs.mockResolvedValue(response)

      const result = await service.getBulkUserRoleAdditionsJobs(token, 0, 20, 'keyword')

      expect(apiClient.getBulkUserRoleAdditionsJobs).toHaveBeenCalledWith(token, {
        pageNumber: 0,
        pageSize: 20,
        search: 'keyword',
      })
      expect(result).toBe(response)
    })
  })

  describe('getBulkUserRoleAdditionsJob', () => {
    it('delegates to the api client', async () => {
      const response = { id: '1' } as BulkUserRoleAdditionsJobDetails
      apiClient.getBulkUserRoleAdditionsJob.mockResolvedValue(response)

      const result = await service.getBulkUserRoleAdditionsJob(token, '1')

      expect(apiClient.getBulkUserRoleAdditionsJob).toHaveBeenCalledWith(token, '1')
      expect(result).toBe(response)
    })
  })

  describe('downloadBulkUserRoleAdditionsJobCsv', () => {
    it('delegates to the api client', async () => {
      const response = {} as Response
      apiClient.downloadBulkUserRoleAdditionsJobCsv.mockResolvedValue(response)

      const result = await service.downloadBulkUserRoleAdditionsJobCsv(token, '1')

      expect(apiClient.downloadBulkUserRoleAdditionsJobCsv).toHaveBeenCalledWith(token, '1')
      expect(result).toBe(response)
    })
  })

  describe('submitBulkUserRoleAdditionsJob', () => {
    it('delegates to the api client', async () => {
      const response = { ok: true } as unknown as Awaited<
        ReturnType<ManageUsersApiClient['createBulkUserRoleAdditionsJob']>
      >
      apiClient.createBulkUserRoleAdditionsJob.mockResolvedValue(response)
      const userCsv = { buffer: Buffer.from('userId\nuser1'), originalname: 'users.csv' }

      const result = await service.submitBulkUserRoleAdditionsJob(token, 'JIRA-1', ['ROLE_1'], userCsv)

      expect(apiClient.createBulkUserRoleAdditionsJob).toHaveBeenCalledWith(
        token,
        { jiraReference: 'JIRA-1', roles: ['ROLE_1'] },
        userCsv,
      )
      expect(result).toBe(response)
    })
  })

  describe('countAndValidateUsersCsv', () => {
    it('throws when no file is provided', async () => {
      await expect(service.countAndValidateUsersCsv(undefined)).rejects.toThrow(
        new CsvValidationError('file is required but was null'),
      )
    })

    it('throws when the file is not a csv', async () => {
      const file = { ...csvFile('userId\nuser1'), originalname: 'users.txt' }

      await expect(service.countAndValidateUsersCsv(file)).rejects.toThrow(
        new CsvValidationError('csv file is required'),
      )
    })

    it('throws when the header is missing the userId column', async () => {
      await expect(service.countAndValidateUsersCsv(csvFile('notUserId\nuser1'))).rejects.toThrow(
        new CsvValidationError('csv file should contain single column with header "userId"'),
      )
    })

    it('throws when the header has more than one column', async () => {
      await expect(service.countAndValidateUsersCsv(csvFile('userId,other\nuser1,x'))).rejects.toThrow(
        new CsvValidationError('csv file should contain single column with header "userId"'),
      )
    })

    it('throws when a row has an empty userId', async () => {
      await expect(service.countAndValidateUsersCsv(csvFile('userId\nuser1\n \n'))).rejects.toThrow(
        new CsvValidationError('each row must contain a non null non empty userId'),
      )
    })

    it('throws when there are no data rows', async () => {
      await expect(service.countAndValidateUsersCsv(csvFile('userId\n'))).rejects.toThrow(
        new CsvValidationError('csv must contain at least 1 row'),
      )
    })

    it('returns the number of users when the csv is valid', async () => {
      const result = await service.countAndValidateUsersCsv(csvFile('userId\nuser1\nuser2\nuser3'))

      expect(result).toBe(3)
    })
  })
})
