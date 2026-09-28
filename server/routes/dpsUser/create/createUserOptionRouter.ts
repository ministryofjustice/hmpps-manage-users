import { Router } from 'express'
import { FormError } from '../../../interfaces/formError'
import paths from '../../paths'
import { bodyFromFlash, formErrorsFromFlash, validateFormOrRedirect } from '../../../middleware/route/formMiddleware'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'

interface Form {
  userType: string
  userExists: string // is a boolean but the form comes across as a string
}

const validate = (body: Form): FormError[] => {
  const errors: FormError[] = []
  if (body.userExists === undefined) {
    errors.push({ href: '#userExists', text: 'Select if user has an existing account' })
  }
  return errors
}

export default (): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.CREATE_USER]))

  router.get('/', async (req, res) => {
    const body = bodyFromFlash<Form>(req)
    const errors = formErrorsFromFlash(req)
    if (body.userType === undefined) {
      return res.redirect(paths.dpsUser.createUser.pattern)
    }
    return res.render('pages/dpsUser/existingAccountOption', {
      ...body,
      errors,
    })
  })

  router.post(
    '/',
    validateFormOrRedirect<Form>(validate, _req => paths.dpsUser.createUserOptions.pattern),
    async (req, res) => {
      const { body } = req
      if (body.userExists === 'true') {
        return res.redirect(paths.dpsUser.createLinkedDpsUser.pattern)
      }
      return res.redirect(paths.dpsUser.createDpsUser.pattern)
    },
  )

  return router
}
