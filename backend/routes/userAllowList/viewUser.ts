import { Request, Response } from 'express'
import paths from '../paths'
import AllowListService from '../../services/userAllowListService'
import getAllowlistStatus from './utils'
import { audit, ManageUsersEvent } from '../../audit'

export default class ViewUserRoutes {
  allowListService: AllowListService

  constructor(allowListService: AllowListService) {
    this.allowListService = allowListService
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const { username } = req.session.userDetails
    const sendAudit = audit(username, { username: req.params.username })
    await sendAudit(ManageUsersEvent.VIEW_ALLOW_LIST_USER_ATTEMPT)
    try {
      const allowListUser = await this.allowListService.getAllowListUser(res.locals.access_token, req.params.username)

      res.render('userAllowList/viewUser', {
        ...allowListUser,
        searchUrl: paths.userAllowList.search({}),
        status: getAllowlistStatus(allowListUser),
      })
    } catch (err) {
      await sendAudit(ManageUsersEvent.VIEW_ALLOW_LIST_USER_FAILURE)
      throw err
    }
  }
}
