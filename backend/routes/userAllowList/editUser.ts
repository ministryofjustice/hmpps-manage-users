import { Request, Response } from 'express'
import paths from '../paths'
import AllowListService from '../../services/userAllowListService'

export default class EditUserRoutes {
  private readonly allowListService: AllowListService

  constructor(allowListService: AllowListService) {
    this.allowListService = allowListService
  }

  private static validate(reason: string) {
    const errors = []
    if (!reason) {
      errors.push({ href: '#reason', text: 'Enter a valid business reason' })
    }
    return errors
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const allowListUser = await this.allowListService.getAllowListUser(req.params.username)

    res.render('userAllowList/editUser', {
      ...allowListUser,
      searchUrl: paths.userAllowList.search({}),
      errors: req.flash('editAllowListUserErrors'),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const errors = EditUserRoutes.validate(req.body.reason)
    if (errors.length > 0) {
      req.flash('editAllowListUserErrors', errors)
      res.redirect(paths.userAllowList.editUser({ username: req.params.username }))
    } else {
      await this.allowListService.updateAllowListUser(
        req.params.username,
        req.body.accessPeriod,
        req.body.reason,
        req.session.userDetails.username,
      )
      res.redirect(paths.userAllowList.viewUser({ username: req.params.username }))
    }
  }
}
