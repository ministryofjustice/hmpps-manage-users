import { Router } from 'express'
import { Services } from '../../services'
import paths from '../paths'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../interfaces/authRole'
import { Page } from '../audit'

export default ({ auditService, emailDomainsService }: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_EMAIL_DOMAINS]))

  router.get('/', async (_req, res) => {
    const { user } = res.locals

    await auditService.logPageView(Page.VIEW_EMAIL_DOMAINS, {
      who: user.username,
    })

    const domains = await emailDomainsService.getAllEmailDomains(user.token)
    const createUrl = paths.emailDomains.create.pattern

    return res.render('pages/emailDomains/list', {
      domains,
      createUrl,
    })
  })

  return router
}
