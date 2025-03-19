import { Request, Response } from 'express'
import paths from '../paths'
import AllowListService from '../../services/userAllowListService'
import getAllowlistStatus from './utils'

export default class ViewUserRoutes {
  allowListService: AllowListService

  constructor(allowListService: AllowListService) {
    this.allowListService = allowListService
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const allowListUser = await this.allowListService.getAllowListUser(res.locals.access_token, req.params.username)

    res.render('userAllowList/viewUser', {
      ...allowListUser,
      searchUrl: paths.userAllowList.search({}),
      status: getAllowlistStatus(allowListUser),
    })
  }
}
