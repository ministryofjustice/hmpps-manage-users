import { Request, Response } from 'express'
import { auditWithSubject, ManageUsersEvent, ManageUsersSubjectType } from '../audit'
import cleanUpRedirect from '../utils/urlUtils'

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
const groupDeleteFactory = (getGroupDetailsApi: any, deleteGroupApi: any, maintainUrl: string) => {
  const stashStateAndRedirectToIndex = (
    req: Request,
    res: Response,
    errors: Array<Record<string, string>>,
    group: Array<Record<string, string>>,
    url: string,
  ) => {
    req.flash('deleteGroupErrors', errors)
    req.flash('group', group)
    res.redirect(cleanUpRedirect(url))
  }

  const index = async (req: Request, res: Response) => {
    const { group } = req.params
    const hasMaintainAuthUsers = Boolean(res.locals && res.locals.user && res.locals.user.maintainAuthUsers)
    try {
      const groupDetails = await getGroupDetailsApi(res.locals, group)
      const groupUrl = `${maintainUrl}/${group}`

      res.render('groupDelete.njk', {
        group,
        groupUrl,
        groupDetails,
        hasMaintainAuthUsers,
        maintainUrl,
      })
    } catch (error) {
      if (error.status === 404) {
        const groupError = [{ href: '#groupCode', text: 'Group does not exist' }]
        req.flash('groupError', groupError)
        res.redirect(cleanUpRedirect(maintainUrl))
      } else {
        throw error
      }
    }
  }

  const deleteGroup = async (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { username } = req.session.userDetails
    const { group } = req.params
    const sendAudit = auditWithSubject(username, group, ManageUsersSubjectType.GROUP_CODE)
    await sendAudit(ManageUsersEvent.DELETE_GROUP_ATTEMPT)
    try {
      await deleteGroupApi(res.locals, group)
      res.redirect(`${maintainUrl}`)
    } catch (error) {
      await sendAudit(ManageUsersEvent.DELETE_GROUP_FAILURE)
      if (error.status === 400) {
        // user already removed from group
        res.redirect(cleanUpRedirect(req.originalUrl))
      } else if (error.status === 404) {
        const groupError = [{ href: '#groupCode', text: 'Group does not exist' }]
        req.flash('groupError', groupError)
        res.redirect(cleanUpRedirect(maintainUrl))
      } else if (error.status === 409 && error.response && error.response.body) {
        const groupUrl = `${maintainUrl}/${group}`
        // group has child groups
        const groupDeleteError = [
          { href: '#groupCode', text: 'Group has child groups please delete before trying to delete parent group' },
        ]
        stashStateAndRedirectToIndex(req, res, groupDeleteError, [{ text: group, href: '#group' }], groupUrl)
      } else {
        throw error
      }
    }
  }

  return { index, deleteGroup }
}

module.exports = {
  groupDeleteFactory,
}
