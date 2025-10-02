import { Request, RequestHandler, Response } from 'express'
import { parse } from 'json2csv'
import paths from '../paths'
import { manageUsersApiBuilder, ManageUsersApiClient, RestClientBuilder } from '../../data'
import { ExternalUsersSearchQuery } from '../../data/manageUsersApiClient'
import { audit, ManageUsersEvent } from '../../audit'
import logger from '../../../logger'

export default class GroupSelectionRoutes {
  manageUsersApiClientBuilder: RestClientBuilder<ManageUsersApiClient>

  constructor(manageUsersApiClientBuilder: RestClientBuilder<ManageUsersApiClient>) {
    this.manageUsersApiClientBuilder = manageUsersApiClientBuilder
  }

  GET: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const manageUsersApi = manageUsersApiBuilder(res.locals.access_token)
    const allGroups = await manageUsersApi.getAllGroups()

    const crsGroups = allGroups
      .filter((group) => group.groupCode.startsWith('INT_CR_PRJ_'))
      .map((g) => ({
        text: g.groupName,
        value: g.groupCode,
      }))

    const selectedGroup = req.query.group
    const selectedGroupName = selectedGroup ? crsGroups.find((group) => group.value === selectedGroup).text : ''
    const downloadUrl = `${paths.crsGroupSelection.download({})}?group=${selectedGroup}`

    res.render('crsGroupSelection/groupSelection', {
      group: selectedGroupName,
      selfUrl: `${paths.crsGroupSelection.groupsSelection({})}`,
      downloadUrl,
      crsGroups,
    })
  }

  DOWNLOAD: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.session.userDetails
    const sendAudit = audit(username, { crsGroup: req.query.group })
    await sendAudit(ManageUsersEvent.DOWNLOAD_CRS_GROUP_USER_REPORT_ATTEMPT)

    try {
      const manageUsersApi = manageUsersApiBuilder(res.locals.access_token)
      const query: ExternalUsersSearchQuery = {
        group: [req.query.group as string],
        page: 0,
        size: 20000,
      }

      const { content } = await manageUsersApi.externalUsersSearch(query)

      const csv = parse(content)

      res.header('Content-Type', 'text/csv')
      res.attachment('crs-group-members.csv')

      res.send(csv)
    } catch (err) {
      await sendAudit(ManageUsersEvent.DOWNLOAD_CRS_GROUP_USER_REPORT_FAILURE)
      logger.error(err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('An error occurred while generating the download')
    }
  }
}
