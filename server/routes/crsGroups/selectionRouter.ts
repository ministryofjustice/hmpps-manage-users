import { ExternalUser, UserGroup } from 'manageUsersApiClient'
import { RequestHandler, Request, Router } from 'express'
import { Parser } from '@json2csv/plainjs'
import { Services } from '../../services'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../interfaces/authRole'
import { hasRole, HmppsUser } from '../../interfaces/hmppsUser'
import paths from '../paths'
import { downloadCsv } from '../../middleware/route/downloadMiddleware'
import { FormError } from '../../interfaces/formError'
import groupValues from '../../presentation/groups'

interface Query {
  group?: string
}

export default (services: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.CONTRACT_MANAGER_VIEW_GROUP]))

  router.get('/', async (req: Request<unknown, unknown, unknown, Query>, res) => {
    const { user } = res.locals
    const { groupsService, externalUserService } = services
    const crsGroups = await groupsService.getAllCRSGroups(user.token)
    const { group } = req.query
    const errors: FormError[] = []
    let groupSize = 0
    let matchedGroup: UserGroup | undefined
    if (group) {
      matchedGroup = crsGroups.find(crsGroup => crsGroup.groupCode === group)
      if (!matchedGroup) {
        errors.push({
          text: "The group you have tried to access either doesn't exist or you don't have permission to view it - please select one from the dropdown",
        })
      } else {
        groupSize = await externalUserService.getUsersInCRSGroup(user.token, group).then(users => users.length)
      }
    }
    res.render('pages/crsGroups/selection', {
      group: matchedGroup,
      selfUrl: paths.crsGroups.select.pattern,
      showDownloadButton: groupSize > 0,
      errors,
      downloadUrl: `${paths.crsGroups.download.pattern}?group=${group}`,
      groupValues: groupValues(crsGroups),
    })
  })

  return router
}

export const downloadHandler = ({
  externalUserService,
  auditService,
}: Services): RequestHandler<unknown, unknown, unknown, Query> => {
  return downloadCsv<Query, ExternalUser[]>(
    'crs-group-members.csv',
    auditService,
    (query, token): Promise<ExternalUser[]> => externalUserService.getUsersInCRSGroup(token, query.group as string),
    (data: ExternalUser[]): string => {
      const fields = ['email', 'enabled', 'firstName', 'lastName', 'lastLoggedIn', 'inactiveReason']
      const json2csvParser = new Parser({ fields })
      return json2csvParser.parse(data)
    },
    (user: HmppsUser): boolean => hasRole(user, AuthRole.CONTRACT_MANAGER_VIEW_GROUP),
  )
}
