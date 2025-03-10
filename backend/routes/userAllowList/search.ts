import { Request, RequestHandler, Response } from 'express'
import moment from 'moment'
import AllowListService from '../../services/userAllowListService'

type QueryParams = {
  user: string
  status: string
}

export default class SearchRoutes {
  allowListService: AllowListService

  constructor(allowListService: AllowListService) {
    this.allowListService = allowListService
  }

  GET: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const users = await this.allowListService.getAllAllowListUsers()
    const currentFilter = this.parseFilter(req.query as QueryParams)
    const displayUsers = users.map((user) => ({
      ...user,
      status: moment().isAfter(user.expiry) ? 'EXPIRED' : 'ACTIVE',
    }))

    res.render('userAllowList/search', {
      currentFilter,
      results: displayUsers,
    })
  }

  private parseFilter(query: QueryParams) {
    return {
      user: query.user?.trim(),
      status: query.status || 'ALL',
    }
  }
}
