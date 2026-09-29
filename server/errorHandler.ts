import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import type { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import logger from '../logger'

type HandledError = Partial<HTTPError> & SanitisedError

export default function createErrorHandler(production: boolean) {
  return (error: HandledError, req: Request, res: Response, _next: NextFunction): void => {
    logger.error(`Error handling request for '${req.originalUrl}', user '${res.locals.user?.username}'`, error)

    // Express/http-errors use `status`; hmpps-rest-client API errors use `responseStatus`
    const status = error.status ?? error.responseStatus

    if (status === 401 || status === 403) {
      logger.info('Logging user out')
      return res.redirect('/sign-out')
    }

    res.locals.message = production
      ? 'Something went wrong. The error has been logged. Please try again'
      : error.message
    res.locals.status = status
    res.locals.stack = production ? null : error.stack

    res.status(status || 500)

    return res.render('pages/error')
  }
}
