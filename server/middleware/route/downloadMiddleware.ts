import { Request, RequestHandler, Response } from 'express'
import { AuditService } from '@ministryofjustice/hmpps-audit-client'
import logger from '../../../logger'
import { canDownload, DownloadAuthorisationCheck } from '../../presentation/searchDpsUser'
import { EventType } from '../../routes/audit'

export type DataProvider<Query, Data> = (query: Query, token: string) => Promise<Readonly<Data>>

export type CsvParser<Data> = (data: Readonly<Data>) => string

export const downloadCsv =
  <Query, Data>(
    filename: string,
    auditService: AuditService,
    dataProvider: DataProvider<Query, Data>,
    csvParser: CsvParser<Data>,
    isAllowedToDownload: DownloadAuthorisationCheck = canDownload,
  ): RequestHandler<unknown, unknown, unknown, Query> =>
  async (req: Request<unknown, unknown, unknown, Query>, res: Response) => {
    const { token, username } = res.locals.user
    const correlationId = crypto.randomUUID()
    const audit = async (eventType: EventType) => {
      await auditService.logAuditEvent({
        what: eventType,
        who: username,
        details: Object.freeze(req.query),
        correlationId,
      })
    }
    await audit(EventType.DOWNLOAD_REPORT_ATTEMPT)
    if (!isAllowedToDownload(res.locals.user)) {
      await audit(EventType.DOWNLOAD_REPORT_FAILURE)
      res.writeHead(403, { 'Content-Type': 'text/plain' })
      return res.end('You are not authorised to the resource')
    }
    try {
      const data = await dataProvider(req.query, token)
      const csv = csvParser(data)
      res.header('Content-Type', 'text/csv')
      res.attachment(filename)
      return res.send(csv)
    } catch (err) {
      await audit(EventType.DOWNLOAD_REPORT_FAILURE)
      logger.error(err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      return res.end('An error occurred while generating the download')
    }
  }
