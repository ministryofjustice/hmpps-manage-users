import type { Request, Response } from 'express'
import { AuditService } from '@ministryofjustice/hmpps-audit-client'
import { downloadCsv, DataProvider, CsvParser } from './downloadMiddleware'

import logger from '../../../logger'
import { DownloadAuthorisationCheck } from '../../presentation/searchDpsUser'
import { EventType } from '../../routes/audit'

const uuid = 'e400adfb-08d8-4d9c-8039-c4eacede867f'
jest.spyOn(global.crypto, 'randomUUID').mockReturnValue(uuid)
jest.mock('@ministryofjustice/hmpps-audit-client')

jest.mock('../../../logger', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
  },
}))

const createResponse = () => {
  const res = {
    header: jest.fn().mockReturnThis(),
    attachment: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    writeHead: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    locals: {
      user: {
        username: 'bob_gen',
        token: 'test-token',
        authSource: 'nomis',
        userId: 'bob',
        staffId: 1,
        name: 'bob',
        displayName: 'bob',
        userRoles: ['ROLE_TEST'],
      },
    },
  }
  return res as unknown as Response
}

describe('downloadCsv', () => {
  type Query = { a: string; b?: string }
  type Data = { rows: Array<{ id: number; name: string }> }

  const filename = 'export.csv'

  let auditService: jest.Mocked<AuditService>
  let req: Request<unknown, unknown, unknown, Query>
  let res: Response
  let next: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    auditService = new AuditService({} as never) as jest.Mocked<AuditService>
    req = {
      query: { a: 'x', b: '42' },
    } as Request<unknown, unknown, unknown, Query>
    res = createResponse()

    next = jest.fn()
  })

  it('logs DOWNLOAD_REPORT_ATTEMPT on every request', async () => {
    const sampleData: Readonly<Data> = Object.freeze({
      rows: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    })
    const csv = 'id,name\n1,Alice\n2,Bob\n'

    const dataProvider: DataProvider<Query, Data> = jest.fn().mockResolvedValue(sampleData)
    const csvParser: CsvParser<Data> = jest.fn().mockReturnValue(csv)
    const canDownload: DownloadAuthorisationCheck = jest.fn().mockReturnValue(true)

    const handler = downloadCsv<Query, Data>(filename, auditService, dataProvider, csvParser, canDownload)

    await handler(req as Request<unknown, unknown, unknown, Query>, res as Response, next)

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        what: EventType.DOWNLOAD_REPORT_ATTEMPT,
        who: 'bob_gen',
        details: { a: 'x', b: '42' },
        correlationId: uuid,
      }),
    )
  })

  it('successful path: provides data, parses to csv, sets headers and sends', async () => {
    const sampleData: Readonly<Data> = Object.freeze({
      rows: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    })
    const csv = 'id,name\n1,Alice\n2,Bob\n'

    const dataProvider: DataProvider<Query, Data> = jest.fn().mockResolvedValue(sampleData)
    const csvParser: CsvParser<Data> = jest.fn().mockReturnValue(csv)
    const canDownload: DownloadAuthorisationCheck = jest.fn().mockReturnValue(true)

    const handler = downloadCsv<Query, Data>(filename, auditService, dataProvider, csvParser, canDownload)

    await handler(req as Request<unknown, unknown, unknown, Query>, res, next)

    expect(dataProvider).toHaveBeenCalledTimes(1)
    expect(dataProvider).toHaveBeenCalledWith({ a: 'x', b: '42' }, 'test-token')

    expect(csvParser).toHaveBeenCalledTimes(1)
    expect(csvParser).toHaveBeenCalledWith(sampleData)

    expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
    expect(res.attachment).toHaveBeenCalledWith(filename)
    expect(res.send).toHaveBeenCalledWith(csv)

    expect(logger.error).not.toHaveBeenCalled()
    expect(res.writeHead).not.toHaveBeenCalled()
    expect(res.end).not.toHaveBeenCalled()
  })

  it('returns 403 when user not authorised and logs failure', async () => {
    const dataProvider: DataProvider<Query, Data> = jest.fn() // should not be called
    const csvParser: CsvParser<Data> = jest.fn() // should not be called
    const canDownload: DownloadAuthorisationCheck = jest.fn().mockReturnValue(false)

    const handler = downloadCsv<Query, Data>(filename, auditService, dataProvider, csvParser, canDownload)
    await handler(req as Request<unknown, unknown, unknown, Query>, res, next)

    expect(res.writeHead).toHaveBeenCalledWith(403, { 'Content-Type': 'text/plain' })
    expect(res.end).toHaveBeenCalledWith('You are not authorised to the resource')

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        what: EventType.DOWNLOAD_REPORT_FAILURE,
        who: 'bob_gen',
        details: { a: 'x', b: '42' },
        correlationId: uuid,
      }),
    )

    // Ensure success path methods not called
    expect(dataProvider).not.toHaveBeenCalled()
    expect(csvParser).not.toHaveBeenCalled()
    expect(res.header).not.toHaveBeenCalled()
    expect(res.attachment).not.toHaveBeenCalled()
    expect(res.send).not.toHaveBeenCalled()
  })

  it('error path: logs and returns 500 with plain text message when dataProvider rejects', async () => {
    const err = new Error('DB down')
    const dataProvider: DataProvider<Query, Data> = jest.fn().mockRejectedValue(err)
    const csvParser: CsvParser<Data> = jest.fn() // should not be called
    const canDownload: DownloadAuthorisationCheck = jest.fn().mockReturnValue(true)

    const handler = downloadCsv<Query, Data>(filename, auditService, dataProvider, csvParser, canDownload)
    await handler(req as Request<unknown, unknown, unknown, Query>, res, next)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(err)

    expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'text/plain' })
    expect(res.end).toHaveBeenCalledWith('An error occurred while generating the download')

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        what: EventType.DOWNLOAD_REPORT_FAILURE,
        who: 'bob_gen',
        details: { a: 'x', b: '42' },
        correlationId: uuid,
      }),
    )

    // Ensure success path methods not called
    expect(res.header).not.toHaveBeenCalled()
    expect(res.attachment).not.toHaveBeenCalled()
    expect(res.send).not.toHaveBeenCalled()
  })

  it('error path: logs and returns 500 when csvParser throws', async () => {
    const dataProvider: DataProvider<Query, Data> = jest
      .fn()
      .mockResolvedValue(Object.freeze({ rows: [{ id: 1, name: 'Alice' }] }))

    const parseErr = new Error('CSV format issue')
    const csvParser: CsvParser<Data> = jest.fn(() => {
      throw parseErr
    })
    const canDownload: DownloadAuthorisationCheck = jest.fn().mockReturnValue(true)

    const handler = downloadCsv<Query, Data>(filename, auditService, dataProvider, csvParser, canDownload)
    await handler(req as Request<unknown, unknown, unknown, Query>, res, next)

    expect(logger.error).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledWith(parseErr)

    expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'text/plain' })
    expect(res.end).toHaveBeenCalledWith('An error occurred while generating the download')

    expect(auditService.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        what: EventType.DOWNLOAD_REPORT_FAILURE,
        who: 'bob_gen',
        details: { a: 'x', b: '42' },
        correlationId: uuid,
      }),
    )

    expect(res.header).not.toHaveBeenCalled()
    expect(res.attachment).not.toHaveBeenCalled()
    expect(res.send).not.toHaveBeenCalled()
  })
})
