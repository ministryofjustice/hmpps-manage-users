import { Readable } from 'stream'
import csv from 'csv-parser'
import { Response } from 'superagent'
import {
  BulkUserRoleAdditionsJobDetails,
  BulkUserRoleAdditionsJobSummary,
  BulkUserRoleAdditionsResponse,
  PagedList,
  UserRole,
} from 'manageUsersApiClient'
import ManageUsersApiClient, { UploadedCsvFile } from '../data/manageUsersApiClient'
import CsvValidationError from './csvValidationError'

export { CsvValidationError }

export default class BulkUserRolesService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  async getSelectableRoles(token: string): Promise<UserRole[]> {
    return this.manageUsersApiClient.searchableRoles(token)
  }

  async getBulkUserRoleAdditionsJobs(
    token: string,
    pageNumber: number,
    pageSize: number,
    search?: string,
  ): Promise<PagedList<BulkUserRoleAdditionsJobSummary>> {
    return this.manageUsersApiClient.getBulkUserRoleAdditionsJobs(token, { pageNumber, pageSize, search })
  }

  async getBulkUserRoleAdditionsJob(token: string, id: string): Promise<BulkUserRoleAdditionsJobDetails> {
    return this.manageUsersApiClient.getBulkUserRoleAdditionsJob(token, id)
  }

  async downloadBulkUserRoleAdditionsJobCsv(token: string, id: string): Promise<Response> {
    return this.manageUsersApiClient.downloadBulkUserRoleAdditionsJobCsv(token, id)
  }

  async submitBulkUserRoleAdditionsJob(
    token: string,
    jiraReference: string,
    roles: string[],
    userCsv: UploadedCsvFile,
  ): Promise<BulkUserRoleAdditionsResponse> {
    return this.manageUsersApiClient.createBulkUserRoleAdditionsJob(token, { jiraReference, roles }, userCsv)
  }

  /**
   * Validates the uploaded users csv file and returns the total number of users it contains.
   * Mirrors the validation previously performed in the legacy bulk user roles controller.
   */
  async countAndValidateUsersCsv(file: Express.Multer.File | undefined): Promise<number> {
    if (!file) {
      throw new CsvValidationError('file is required but was null')
    }
    if (!file.originalname.endsWith('.csv')) {
      throw new CsvValidationError('csv file is required')
    }

    return new Promise<number>((resolve, reject) => {
      let userCount = 0
      let hasValidationError = false

      Readable.from(file.buffer)
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          if (hasValidationError) return
          if (headers.length > 1 || headers[0] !== 'userId') {
            hasValidationError = true
            reject(new CsvValidationError('csv file should contain single column with header "userId"'))
          }
        })
        .on('data', (row: Record<string, string>) => {
          if (hasValidationError) return
          const userId = row?.userId

          if (!userId || userId.trim().length === 0) {
            hasValidationError = true
            reject(new CsvValidationError('each row must contain a non null non empty userId'))
            return
          }
          userCount += 1
        })
        .on('end', () => {
          if (hasValidationError) return

          if (userCount === 0) {
            reject(new CsvValidationError('csv must contain at least 1 row'))
            return
          }
          resolve(userCount)
        })
        .on('error', (err: Error) => {
          reject(new CsvValidationError(err?.message || String(err)))
        })
    })
  }
}
