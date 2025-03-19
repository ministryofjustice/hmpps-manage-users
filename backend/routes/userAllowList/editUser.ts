import { Request, Response } from 'express'
import paths from '../paths'
import AllowListService from '../../services/userAllowListService'
import { UserAllowlistPatchRequest } from '../../@types/manageUsersApi'
import { trimObjValues } from '../../utils/utils'

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
    const form = req.flash('form')[0]
    const allowListUser = await this.allowListService.getAllowListUser(res.locals.access_token, req.params.username)
    const accessPeriod = form?.accessPeriod ?? 'ONE_MONTH'

    res.render('userAllowList/editUser', {
      ...allowListUser,
      accessPeriod,
      searchUrl: paths.userAllowList.search({}),
      errors: req.flash('editAllowListUserErrors'),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const form = trimObjValues(req.body)
    const errors = EditUserRoutes.validate(req.body.reason)
    if (errors.length > 0) {
      req.flash('editAllowListUserErrors', errors)
      req.flash('form', form)
      res.redirect(paths.userAllowList.editUser({ username: req.params.username }))
    } else {
      const updateRequest: UserAllowlistPatchRequest = { ...req.body }
      await this.allowListService.updateAllowListUser(res.locals.access_token, req.body.id, updateRequest)
      res.redirect(paths.userAllowList.viewUser({ username: req.params.username }))
    }
  }
}
