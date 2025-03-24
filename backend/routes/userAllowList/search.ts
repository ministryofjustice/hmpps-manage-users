import { Request, RequestHandler, Response } from 'express'
import { parse } from 'json2csv'
import querystring from 'querystring'
import AllowListService from '../../services/userAllowListService'
import { UserAllowlistQuery } from '../../data/manageUsersApiClient'
import paginationService from '../../services/paginationService'
import config from '../../config'
import getAllowlistStatus from './utils'
import logger from '../../log'
import paths from '../paths'

type QueryParams = {
  user: string
  status: string
  page: number
}

export default class SearchRoutes {
  allowListService: AllowListService

  downloadLimit: number = config.featureSwitches.manageUserAllowList.downloadLimit

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
    const downloadUrl = `${paths.userAllowList.download({})}?${querystring.stringify(currentFilter)}`

    res.render('userAllowList/search', {
      currentFilter,
      results: displayUsers,
      pagination: paginationService.getPagination(
        { totalElements, page: number, size: query.size },
        new URL(`${req.protocol}://${req.get('host')}${req.originalUrl}`),
      ),
      downloadUrl,
      showDownloadLink: totalElements <= this.downloadLimit ? true : undefined,
      downloadLimit: this.downloadLimit,
    })
  }

  DOWNLOAD: RequestHandler = async (req: Request, res: Response): Promise<void> => {
    const currentFilter = this.parseFilter(req.query as unknown as QueryParams)
    const query: UserAllowlistQuery = {
      name: currentFilter.user,
      status: currentFilter.status,
      page: currentFilter.page,
      size: this.downloadLimit,
    }

    try {
      const { content } = await this.allowListService.getAllAllowListUsers(res.locals.access_token, query)
      const displayUsers = content.map((user) => ({
        ...user,
        status: getAllowlistStatus(user),
      }))

      const csv = parse(displayUsers)

      res.header('Content-Type', 'text/csv')
      res.attachment('user-allowlist-search.csv')

      res.send(csv)
    } catch (err) {
      logger.error(err)
      res.writeHead(500, { 'Content-Type': 'text/plain' })
      res.end('An error occurred while generating the download')
    }
  }

  private parseFilter(query: QueryParams) {
    return {
      user: query.user?.trim(),
      status: query.status || 'ALL',
      page: query.page || 0,
    }
  }
}
