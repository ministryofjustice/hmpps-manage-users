import { Request, RequestHandler, Response } from 'express'
import AllowListService from '../../services/userAllowListService'
import { UserAllowlistQuery } from '../../data/manageUsersApiClient'
import paginationService from '../../services/paginationService'
import config from '../../config'
import getAllowlistStatus from './utils'

type QueryParams = {
  user: string
  status: string
  page: number
}

export default class SearchRoutes {
  allowListService: AllowListService

  constructor(allowListService: AllowListService) {
    this.allowListService = allowListService
  }

  GET: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const currentFilter = this.parseFilter(req.query as unknown as QueryParams)
    const query: UserAllowlistQuery = {
      name: currentFilter.user,
      status: currentFilter.status,
      page: currentFilter.page,
      size: config.featureSwitches.manageUserAllowList.pageSize,
    }
    const { content, totalElements, number } = await this.allowListService.getAllAllowListUsers(
      res.locals.access_token,
      query,
    )
    const displayUsers = content.map((user) => ({
      ...user,
      status: getAllowlistStatus(user),
    }))

    res.render('userAllowList/search', {
      currentFilter,
      results: displayUsers,
      pagination: paginationService.getPagination(
        { totalElements, page: number, size: query.size },
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
    })
  }

  private parseFilter(query: QueryParams) {
    return {
      user: query.user?.trim(),
      status: query.status || 'ALL',
      page: query.page || 0,
    }
  }
}
