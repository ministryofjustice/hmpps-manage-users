import { Request, Response } from 'express'
import { auditWithSubject } from '../audit/manageUsersAudit'
import { ManageUsersSubjectType } from '../audit/manageUsersSubjectType'
import { ManageUsersEvent } from '../audit/manageUsersEvent'

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const selectCaseloadsFactory = (getUserAssignableCaseloads: any, saveCaseloads: any, manageUrl: string) => {
  const stashStateAndRedirectToIndex = (req: Request, res: Response, errors: Array<Record<string, string>>) => {
    req.flash('addCaseloadErrors', errors)
    res.redirect(req.originalUrl)
  }

  const index = async (req: Request, res: Response) => {
    const { userId } = req.params
    const staffUrl = `${manageUrl}/${userId}/details`
    type caseload = { id: string; name: string }

    const [user, assignableCaseloads] = await getUserAssignableCaseloads(res.locals, userId)
    const caseloadDropdownValues = assignableCaseloads.map((c: caseload) => ({
      text: c.name,
      value: c.id,
    }))

    res.render('addUserCaseload.njk', {
      staff: { ...user, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      caseloadDropdownValues,
      searchTitle: 'Search for a DPS user',
      searchUrl: '/search-with-filter-dps-users',
      errors: req.flash('addCaseloadErrors'),
    })
  }

  const post = async (req: Request, res: Response) => {
    const { username } = req.session.userDetails
    const { userId } = req.params
    const { caseloads } = req.body
    const staffUrl = `${manageUrl}/${userId}/details`

    if (!caseloads) {
      const errors = [{ href: '#caseloads', text: 'Select at least one caseload' }]
      stashStateAndRedirectToIndex(req, res, errors)
    } else {
      const caseloadArray = Array.isArray(caseloads) ? caseloads : [caseloads]
      const sendAudit = auditWithSubject(username, userId, ManageUsersSubjectType.USER_ID, { caseloads: caseloadArray })
      await sendAudit(ManageUsersEvent.ADD_USER_CASELOAD_ATTEMPT)
      try {
        await saveCaseloads(res.locals, userId, caseloadArray)
      } catch {
        await sendAudit(ManageUsersEvent.ADD_USER_CASELOAD_FAILURE)
      }
      res.redirect(`${staffUrl}`)
    }
  }

  return { index, post }
}

module.exports = {
  selectCaseloadsFactory,
}
