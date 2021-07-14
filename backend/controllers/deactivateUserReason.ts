import { Request, Response } from 'express'
import validate from './deactivateUserReasonValidation'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const deactivateUserReasonFactory = (deactivateUserApi: any, manageUrl: string, title: string) => {
  const stashStateAndRedirectToIndex = (
    req: Request,
    res: Response,
    errors: Array<Record<string, string>>,
    reason: Array<Record<string, string>>,
  ) => {
    req.flash('deactivatedUserReasonErrors', errors)
    req.flash('deactivatedUserReason', reason)
    res.redirect(req.originalUrl)
  }

  const index = async (req: Request, res: Response) => {
    const { username, userId } = req.params

    const staffUrl = `${manageUrl}/${username}/${userId}/details`

    const flashReason = req.flash('deactivatedUserReason')
    const reason = flashReason != null && flashReason.length > 0 ? flashReason[0] : null

    res.render('userDeactivate.njk', {
      title,
      username,
      staffUrl,
      reason,
      errors: req.flash('deactivatedUserReasonErrors'),
    })
  }

  const post = async (req: Request, res: Response) => {
    const { username, userId } = req.params
    const { reason } = req.body
    const staffUrl = `${manageUrl}/${username}/${userId}`
    const errors = validate({ username, reason })
    const reasonText = [{ text: reason, href: '#reason' }]

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, reasonText)
    } else {
      try {
        await deactivateUserApi(res.locals, username, reason)
        res.redirect(`${staffUrl}/details`)
      } catch (error) {
        if (error.status === 403) {
          const apiError = [
            {
              href: '#reason',
              text: 'You are not able to maintain this user, user does not belong to any groups you manage',
            },
          ]
          stashStateAndRedirectToIndex(req, res, apiError, reasonText)
        } else {
          throw error
        }
      }
    }
  }

  return { index, post }
}

module.exports = {
  deactivateUserReasonFactory,
}
