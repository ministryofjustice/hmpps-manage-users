import { RequestHandler, Router } from 'express'
import paths from '../../paths'
import { FormError } from '../../../interfaces/formError'
import { caseloadText, showCaseloadDropdown, UserTypeKey } from '../../../presentation/userType'
import { validateUsername } from '../../../presentation/validation/userValidation'
import {
  bodyFromFlash,
  flashBody,
  flashErrors,
  formErrorsFromFlash,
  validateFormOrRedirect,
} from '../../../middleware/route/formMiddleware'
import { Services } from '../../../services'
import { CreateLinkedDpsUserRequest } from '../../../interfaces/createLinkedDpsUserRequest'
import authRoleGuardMiddleware from '../../../middleware/route/authRoleGuardMiddleware'
import AuthRole from '../../../interfaces/authRole'
import { HttpStatusCode, isErrorResponse } from '../../../utils/utils'
import { EventType } from '../../audit'

const validate = (body: CreateLinkedDpsUserRequest): FormError[] => {
  const errors: FormError[] = []

  errors.push(
    ...validateUsername(body.existingUsername, 'existingUsername', 'an existing username', 'Existing username'),
  )
  if (body.searchUser == null) {
    errors.push(...validateUsername(body.username))

    const userTypeKey = body.userType as UserTypeKey
    if (showCaseloadDropdown(userTypeKey) && (!body.defaultCaseloadId || body.defaultCaseloadId === '--')) {
      errors.push({ href: '#defaultCaseloadId', text: caseloadText(userTypeKey) })
    }
  }

  return errors
}

export default ({ dpsUserService, auditService }: Services): Router => {
  const postSearch = (): RequestHandler => {
    return async (req, res, next) => {
      if (req.body.searchUser !== undefined) {
        const errors: FormError[] = []
        const body = bodyFromFlash<CreateLinkedDpsUserRequest>(req)
        try {
          const userFound = await dpsUserService.getDpsUser(res.locals.user.token, body.existingUsername)
          const updatedBody = {
            ...body,
            firstName: userFound.firstName,
            lastName: userFound.lastName,
            email: userFound.primaryEmail,
            existingUsername: userFound.username,
          }
          flashBody(req, updatedBody)
          return res.redirect(paths.dpsUser.createLinkedDpsUser.pattern)
        } catch (err) {
          if (!isErrorResponse(err)) {
            throw err
          }
          if (err.responseStatus === HttpStatusCode.BAD_REQUEST && err.data) {
            const { userMessage } = err.data
            const errorDetails = { text: userMessage ?? 'Unable to find the existing user' }
            errors.push(errorDetails)
          } else if (err.responseStatus === HttpStatusCode.NOT_FOUND) {
            const notFoundError = { href: '#existingUsername', text: 'Existing username not found' }
            errors.push(notFoundError)
          } else {
            throw err
          }
        }
        if (errors.length) {
          flashBody(req, body)
          flashErrors(req, errors)
          return res.redirect(paths.dpsUser.createLinkedDpsUser.pattern)
        }
        // Do we need an audit event here for simply finding a valid user??
      }
      return next()
    }
  }

  const postCreate = (): RequestHandler => {
    return async (req, res) => {
      const errors: FormError[] = []
      const body = bodyFromFlash<CreateLinkedDpsUserRequest>(req)
      const { username } = res.locals.user
      let newUsername: string = ''
      try {
        newUsername = await dpsUserService.createLinkedDpsUser(res.locals.user.token, body)
      } catch (err) {
        if (!isErrorResponse(err)) {
          throw err
        }
        if (err.responseStatus === 400 && err.data) {
          const { userMessage } = err.data
          const errorDetails = { text: userMessage ?? 'Unable to create linked DPS user' }
          errors.push(errorDetails)
        } else if (err.responseStatus === 409 && err.data) {
          const usernameError = err.data.userMessage?.includes('already exists for this staff member')
            ? { href: '#existingUsername', text: 'Username already linked to another account' }
            : { href: '#username', text: 'Username already exists' }
          errors.push(usernameError)
        } else if (err.responseStatus === 404) {
          const usernameError = { href: '#existingUsername', text: 'Username not found' }
          errors.push(usernameError)
        } else {
          throw err
        }
      }
      if (errors.length) {
        flashBody(req, body)
        flashErrors(req, errors)
        return res.redirect(paths.dpsUser.createLinkedDpsUser.pattern)
      }
      await auditService.logAuditEvent({
        what: EventType.CREATE_LINKED_DPS_USER,
        who: username,
        subjectId: newUsername,
        subjectType: 'USER_ID',
        details: Object.freeze(body),
      })
      return res.render('pages/dpsUser/createLinkedSuccess', {
        username: newUsername,
      })
    }
  }

  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.CREATE_USER]))

  router.get('/', async (req, res) => {
    const body = bodyFromFlash<CreateLinkedDpsUserRequest>(req)
    const errors = formErrorsFromFlash(req)
    if (body.userType === undefined) {
      return res.redirect(paths.dpsUser.createUser.pattern)
    }
    const caseloads = await dpsUserService.getCaseloads(res.locals.user.token)
    return res.render('pages/dpsUser/createLinked', {
      ...body,
      caseloads,
      errors,
    })
  })

  router.post(
    '/',
    validateFormOrRedirect<CreateLinkedDpsUserRequest>(validate, _req => paths.dpsUser.createLinkedDpsUser.pattern),
    postSearch(),
    postCreate(),
  )

  return router
}
