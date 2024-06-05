import { Request, Response } from 'express'
import { auditService, USER_ID_SUBJECT_TYPE } from '@ministryofjustice/hmpps-audit-client'

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
      await saveCaseloads(res.locals, userId, caseloadArray)
      await auditService.sendAuditMessage({
        action: 'ADD_USER_CASELOAD',
        who: username,
        subjectId: userId,
        subjectType: USER_ID_SUBJECT_TYPE,
        details: JSON.stringify({ caseloads: caseloadArray }),
        service: 'hmpps-manage-users',
      })
      res.redirect(`${staffUrl}`)
    }
  }

  return { index, post }
}

module.exports = {
  selectCaseloadsFactory,
}
