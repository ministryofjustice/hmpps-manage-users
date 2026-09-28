import { Router } from 'express'
import { CreateEmailDomainRequest, EmailDomain } from 'manageUsersApiClient'
import { Services } from '../../services'
import {
  bodyFromFlash,
  flashBody,
  flashErrors,
  formErrorsFromFlash,
  validateFormOrRedirect,
} from '../../middleware/route/formMiddleware'
import paths from '../paths'
import { FormError } from '../../interfaces/formError'
import { validateDomainDescription, validateDomainName } from '../../presentation/validation/emailDomainValidation'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { HttpStatusCode, isErrorResponse } from '../../utils/utils'
import { EventType } from '../audit'

const validate = (body: CreateEmailDomainRequest): FormError[] => {
  const errors: FormError[] = []

  errors.push(...validateDomainName(body.name))
  errors.push(...validateDomainDescription(body.description))

  return errors
}

export default (services: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_EMAIL_DOMAINS]))

  router.get('/', async (req, res) => {
    const body = bodyFromFlash<CreateEmailDomainRequest>(req)
    const errors = formErrorsFromFlash(req)

    const createUrl = paths.emailDomains.create.pattern
    const listUrl = paths.emailDomains.list.pattern

    return res.render('pages/emailDomains/create', {
      ...body,
      errors,
      createUrl,
      listUrl,
    })
  })

  router.post(
    '/',
    validateFormOrRedirect(validate, _req => paths.emailDomains.create.pattern),
    async (req, res) => {
      const { auditService, emailDomainsService } = services
      const body = bodyFromFlash<CreateEmailDomainRequest>(req)
      const { username } = res.locals.user
      let emailDomain: EmailDomain
      try {
        emailDomain = await emailDomainsService.createEmailDomain(res.locals.user.token, body)
      } catch (err) {
        if (isErrorResponse(err) && err.responseStatus === HttpStatusCode.CONFLICT && err.data) {
          flashBody(req, body)
          flashErrors(req, [{ href: '#name', text: err.data.userMessage ?? 'This email domain already exists' }])
          return res.redirect(paths.emailDomains.create.pattern)
        }
        throw err
      }
      await auditService.logAuditEvent({
        what: EventType.CREATE_EMAIL_DOMAIN,
        who: username,
        subjectId: emailDomain.id,
        subjectType: 'EMAIL_DOMAIN_ID',
        details: body,
      })
      return res.redirect(paths.emailDomains.list.pattern)
    },
  )

  return router
}
