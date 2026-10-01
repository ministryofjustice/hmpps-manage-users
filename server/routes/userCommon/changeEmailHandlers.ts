import { Request, RequestHandler, Response } from 'express'
import { Services } from '../../services'
import { CommonUser, UserParam, UserUrlProvider } from './paramTypes'
import { bodyFromFlash, flashBody, flashErrors, formErrorsFromFlash } from '../../middleware/route/formMiddleware'
import { FormError } from '../../interfaces/formError'
import emailVerificationError from '../../presentation/errors'
import { validateEmail } from '../../presentation/validation/userValidation'
import { HttpStatusCode, isErrorResponse } from '../../utils/utils'
import { EventType } from '../audit'

export interface Form {
  email: string
}

export const validate = (body: Form): FormError[] => validateEmail(body.email)

type UserProvider<UserType> = (token: string, userId: string, services: Services) => Promise<UserType>

export const changeEmailGetHandler =
  <UserType extends CommonUser>(
    services: Services,
    searchTitle: string,
    searchUrl: string,
    userDetailsUrlProvider: UserUrlProvider,
    userProvider: UserProvider<UserType>,
  ): RequestHandler<UserParam> =>
  async (req: Request<UserParam>, res: Response) => {
    const { userId } = req.params
    const { token } = res.locals.user
    const staffUrl = userDetailsUrlProvider(userId)

    const staffUser = await userProvider(token, userId, services)
    const body = bodyFromFlash<Form>(req)
    const email = body.email != null && body.email.length > 0 ? body.email : staffUser.email

    return res.render('pages/changeEmail', {
      staff: { username: staffUser.username, name: `${staffUser.firstName} ${staffUser.lastName}` },
      searchTitle,
      searchUrl,
      staffUrl,
      currentEmail: email,
      errors: formErrorsFromFlash(req),
    })
  }

type EmailChanger = (services: Services, token: string, userId: string, email: string) => Promise<unknown>

export const changeEmailPostHandler =
  (
    services: Services,
    emailChanger: EmailChanger,
    changeEmailUrlProvider: UserUrlProvider,
    changeEmailSuccessProvider: UserUrlProvider,
  ): RequestHandler<UserParam> =>
  async (req: Request<UserParam>, res: Response) => {
    const { auditService } = services
    const { userId } = req.params
    const body = bodyFromFlash<Form>(req)
    const errors: FormError[] = []

    try {
      await emailChanger(services, res.locals.user.token, userId, body.email)
    } catch (err) {
      if (isErrorResponse(err) && err.responseStatus === HttpStatusCode.BAD_REQUEST && err.data) {
        errors.push({ href: '#email', text: emailVerificationError(err) })
      } else {
        throw err
      }
    }

    flashBody(req, body)
    if (errors.length) {
      flashErrors(req, errors)
      return res.redirect(changeEmailUrlProvider(userId))
    }
    await auditService.logAuditEvent({
      what: EventType.UPDATE_USER,
      who: res.locals.user.username,
      subjectId: userId,
      subjectType: 'USER_ID',
      details: { ...body },
    })
    return res.redirect(changeEmailSuccessProvider(userId))
  }

export const changeEmailSuccessHandler =
  <UserType extends CommonUser>(
    services: Services,
    userDetailsUrlProvider: UserUrlProvider,
    userProvider: UserProvider<UserType>,
  ): RequestHandler<UserParam> =>
  async (req: Request<UserParam>, res: Response) => {
    const { userId } = req.params
    const staffUrl = userDetailsUrlProvider(userId)

    const body = bodyFromFlash<Form>(req)
    const user = await userProvider(res.locals.user.token, userId, services)
    const usernameChanged = user.username.includes('@')

    return res.render('pages/changeEmailSuccess', { email: body.email, detailsLink: staffUrl, usernameChanged })
  }
