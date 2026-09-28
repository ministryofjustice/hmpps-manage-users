import { Router } from 'express'
import { Services } from '../../services'
import { bodyFromFlash, formErrorsFromFlash, validateFormOrRedirect } from '../../middleware/route/formMiddleware'
import paths from '../paths'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import logger from '../../../logger'
import { FormError } from '../../interfaces/formError'
import groupValues from '../../presentation/groups'
import { Page } from '../audit'

interface Form {
  groupCode: string
}

const validate = (body: Form): FormError[] => {
  const errors: FormError[] = []

  if (!body.groupCode) {
    errors.push({ href: '#groupCode', text: 'Enter a group code' })
  }

  return errors
}

export default (services: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS, AuthRole.AUTH_GROUP_MANAGER]))

  router.get('/', async (req, res) => {
    const { auditService, externalUserService } = services
    const { user } = res.locals
    const errors = formErrorsFromFlash(req)
    const maintainUrl = paths.groups.list.pattern

    try {
      const groups = await externalUserService.assignableGroups(user.token)

      await auditService.logPageView(Page.VIEW_GROUP_LIST, {
        who: user.username,
      })

      return res.render('pages/groups/list', {
        groupValues: groupValues(groups),
        maintainUrl,
        errors,
      })
    } catch (err) {
      logger.info(`An error occurred while fetching groups`, err)
      return res.redirect('/')
    }
  })

  router.post(
    '/',
    validateFormOrRedirect(validate, _req => paths.groups.list.pattern),
    async (req, res) => {
      const body = bodyFromFlash<Form>(req)
      return res.redirect(paths.groups.details({ group: body.groupCode }))
    },
  )

  return router
}
