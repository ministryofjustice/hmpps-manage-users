import { Request, Response } from 'express'
import paths from '../paths'
import AllowListService from '../../services/userAllowListService'
import { validateEmailFormat } from '../../controllers/userValidation'
import { trimObjValues } from '../../utils/utils'
import { UserAllowlistAddRequest } from '../../@types/manageUsersApi'
import { audit, ManageUsersEvent } from '../../audit'

export default class AddUserRoutes {
  allowListService: AllowListService

  constructor(allowListService: AllowListService) {
    this.allowListService = allowListService
  }

  private static validate(allowListUserRequest: UserAllowlistAddRequest, usernameExists: boolean) {
    const errors = []
    if (!allowListUserRequest.username) {
      errors.push({ href: '#username', text: 'Enter a valid username' })
    } else if (usernameExists) {
      errors.push({ href: '#username', text: 'Username already exists, please update their access instead' })
    }
    if (!allowListUserRequest.email) {
      errors.push({ href: '#email', text: 'Enter a valid email' })
    }
    if (!allowListUserRequest.firstName) {
      errors.push({ href: '#firstName', text: 'Enter a valid first name' })
    }
    if (!allowListUserRequest.lastName) {
      errors.push({ href: '#lastName', text: 'Enter a valid last name' })
    }
    if (!allowListUserRequest.reason) {
      errors.push({ href: '#reason', text: 'Enter a valid business reason' })
    }

    errors.push(...validateEmailFormat(allowListUserRequest.email))

    return errors
  }

  GET = async (req: Request, res: Response): Promise<void> => {
    const form = req.flash('form')[0]
    const accessPeriod = form?.accessPeriod ?? 'ONE_MONTH'
    res.render('userAllowList/addUser', {
      ...form,
      accessPeriod,
      errors: req.flash('addAllowListUserErrors'),
    })
  }

  POST = async (req: Request, res: Response): Promise<void> => {
    const form = trimObjValues(req.body)
    const allowListUserRequest: UserAllowlistAddRequest = {
      ...form,
    }
    const usernameExists = await this.allowListService.usernameExists(
      res.locals.access_token,
      allowListUserRequest.username,
    )
    const errors = AddUserRoutes.validate(allowListUserRequest, usernameExists)
    if (errors.length > 0) {
      req.flash('addAllowListUserErrors', errors)
      req.flash('form', form)
      res.redirect(paths.userAllowList.addUser({}))
    } else {
      const { username } = req.session.userDetails
      const sendAudit = audit(username, { allowListUserRequest })
      await sendAudit(ManageUsersEvent.ADD_ALLOW_LIST_USER_ATTEMPT)

      try {
        await this.allowListService.addAllowListUser(res.locals.access_token, allowListUserRequest)
        res.redirect(paths.userAllowList.search({}))
      } catch (err) {
        await sendAudit(ManageUsersEvent.ADD_ALLOW_LIST_USER_FAILURE)
        throw err
      }
    }
  }
}
