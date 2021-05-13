import { Request, Response } from 'express'
import validate from './deactivateUserReasonValidation'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const deactivateUserReasonFactory = (deactivateUserApi: any, manageUrl: string, title: string) => {
  const stashStateAndRedirectToIndex = (req: Request, res: Response, errors: Array<Record<string, string>>) => {
    req.flash('deactivatedUserReasonErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req: Request, res: Response) => {
    const { username } = req.params

    const staffUrl = `${manageUrl}/${username}/details`
    res.render('userDeactivate.njk', {
      title,
      username,
      staffUrl,
      errors: req.flash('deactivatedUserReasonErrors'),
    })
  }

  const post = async (req: Request, res: Response) => {
    const { username } = req.params
    const { reason } = req.body
    const staffUrl = `${manageUrl}/${username}`
    const errors = validate({ username, reason })

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors)
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
          stashStateAndRedirectToIndex(req, res, apiError)
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
