import { Request, RequestHandler, Response } from 'express'
import { parse } from 'json2csv'
import paths from '../paths'
import { manageUsersApiBuilder, ManageUsersApiClient, RestClientBuilder } from '../../data'
import { audit, ManageUsersEvent } from '../../audit'
import logger from '../../../logger'
import { ExternalUser } from '../../@types/manageUsersApi'

export default class GroupSelectionRoutes {
  manageUsersApiClientBuilder: RestClientBuilder<ManageUsersApiClient>

  constructor(manageUsersApiClientBuilder: RestClientBuilder<ManageUsersApiClient>) {
    this.manageUsersApiClientBuilder = manageUsersApiClientBuilder
  }

  GET: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const manageUsersApi = manageUsersApiBuilder(res.locals.access_token)
    const allCRSGroups = await manageUsersApi.getAllCRSGroups()

    const crsGroups = allCRSGroups.map((g) => ({
      text: g.groupName,
      value: g.groupCode,
    }))

    const selectedGroup = req.query.group
    const selectedGroupName = selectedGroup ? crsGroups.find((group) => group.value === selectedGroup).text : ''
    const downloadUrl = `${paths.crsGroupSelection.download({})}?group=${selectedGroup}`
    let groupSize = 0
    if (selectedGroup) {
      const usersInGroup = await manageUsersApi.getUsersInCRSGroup(req.query.group as string)
      groupSize = usersInGroup.length
    }
    res.render('crsGroupSelection/groupSelection', {
      group: selectedGroupName,
      selfUrl: `${paths.crsGroupSelection.groupsSelection({})}`,
      showDownloadButton: groupSize > 0,
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
      const content = await manageUsersApi.getUsersInCRSGroup(req.query.group as string)

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
