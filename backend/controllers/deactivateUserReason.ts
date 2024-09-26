import { Request, Response } from 'express'
import validate from './deactivateUserReasonValidation'
import { auditWithSubject, ManageUsersEvent, ManageUsersSubjectType } from '../audit'
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
    const { userId } = req.params

    const staffUrl = `${manageUrl}/${userId}/details`

    const flashReason = req.flash('deactivatedUserReason')
    const reason = flashReason != null && flashReason.length > 0 ? flashReason[0] : null

    res.render('userDeactivate.njk', {
      title,
      staffUrl,
      reason,
      errors: req.flash('deactivatedUserReasonErrors'),
    })
  }

  const post = async (req: Request, res: Response) => {
    const { userId } = req.params
    const { reason } = req.body
    const staffUrl = `${manageUrl}/${userId}`
    const errors = validate({ userId, reason })
    const reasonText = [{ text: reason, href: '#reason' }]

    const sendAudit = auditWithSubject(req.session.userDetails.username, userId, ManageUsersSubjectType.USER_ID)
    await sendAudit(ManageUsersEvent.DEACTIVATE_USER_ATTEMPT)

    if (errors.length > 0) {
      await sendAudit(ManageUsersEvent.DEACTIVATE_USER_FAILURE)
      stashStateAndRedirectToIndex(req, res, errors, reasonText)
    } else {
      try {
        await deactivateUserApi(res.locals, userId, reason)
        res.redirect(`${staffUrl}/details`)
      } catch (error) {
        await sendAudit(ManageUsersEvent.DEACTIVATE_USER_FAILURE)
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
