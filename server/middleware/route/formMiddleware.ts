import { Request, Response, RequestHandler, NextFunction } from 'express'
import { FormError } from '../../interfaces/formError'

export type Validator<T, Param> = (form: T, req: Request<Param>, res: Response) => FormError[]
export type RedirectProvider<Param> = (req: Request<Param>) => string

export const validateFormOrRedirect =
  <Body, Param = unknown>(
    validator: Validator<Body, Param>,
    redirectProvider: RedirectProvider<Param>,
  ): RequestHandler<Param> =>
  async (req: Request<Param>, res: Response, next: NextFunction) => {
    const { body } = req
    const { _csrf, ...form } = body // remove the _csrf from the flashed body
    const errors: FormError[] = validator(form, req, res)
    flashBody(req, form)
    if (errors.length > 0) {
      flashErrors(req, errors)
      return res.redirect(redirectProvider(req))
    }
    return next()
  }

export const flashErrors = <Param = unknown>(req: Request<Param>, errors: FormError[]) => {
  req.flash('errors', errors)
}

export const formErrorsFromFlash = <Param = unknown>(req: Request<Param>): FormError[] => {
  const errors = req.flash('errors')
  return errors.length > 0 ? (errors as unknown as FormError[]) : []
}

export const flashBody = <Param = unknown>(req: Request<Param>, body: object) => {
  req.flash('requestBody', JSON.stringify(body))
}

export const bodyFromFlash = <T, Param = unknown>(req: Request<Param>): T => {
  const requestBodyFlash = req.flash('requestBody')
  return requestBodyFlash.length > 0 ? (JSON.parse(requestBodyFlash[0]) as T) : ({} as T)
}
