import { Request, Response } from 'express'

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
    if (caseloadDropdownValues.length > 0) {
      caseloadDropdownValues.push({ divider: 'or' })
      caseloadDropdownValues.push({ text: 'All caseloads', value: 'ALL', behaviour: 'exclusive' })
    }
    const assignableIds = Array.from(assignableCaseloads.map((c: caseload) => c.id))

    res.render('addUserCaseload.njk', {
      staff: { ...user, name: `${user.firstName} ${user.lastName}` },
      staffUrl,
      caseloadDropdownValues,
      assignableIds,
      searchTitle: 'Search for a DPS user',
      searchUrl: '/search-with-filter-dps-users',
      errors: req.flash('addCaseloadErrors'),
    })
  }

  const post = async (req: Request, res: Response) => {
    const { userId } = req.params
    const { caseloads, assignableCaseloads } = req.body
    const staffUrl = `${manageUrl}/${userId}/details`

    if (!caseloads) {
      const errors = [{ href: '#caseloads', text: 'Select at least one caseload' }]
      stashStateAndRedirectToIndex(req, res, errors)
    } else {
      let caseloadArray = Array.isArray(caseloads) ? caseloads : [caseloads]
      if (caseloads.includes('ALL')) {
        caseloadArray = assignableCaseloads.split(',')
      }

      await saveCaseloads(res.locals, userId, caseloadArray)
      res.redirect(`${staffUrl}`)
    }
  }

  return { index, post }
}

module.exports = {
  selectCaseloadsFactory,
}
