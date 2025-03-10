import { Request, Response } from 'express'
import moment from 'moment'
import paths from '../paths'
import AllowListService from '../../services/userAllowListService'

export default class ViewUserRoutes {
  allowListService: AllowListService

  constructor(allowListService: AllowListService) {
    this.allowListService = allowListService
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const allowListUser = await this.allowListService.getAllowListUser(req.params.username)

    res.render('userAllowList/viewUser', {
      ...allowListUser,
      searchUrl: paths.userAllowList.search({}),
      status: moment().isAfter(allowListUser.expiry) ? 'EXPIRED' : 'ACTIVE',
    })
  }
}
