import { NextFunction, Request, Response, RequestHandler } from 'express'
import { jwtDecode } from 'jwt-decode'
import AuthRole from '../../interfaces/authRole'
import logger from '../../../logger'

export default function authRoleGuardMiddleware<Param = unknown>(authorisedRoles: AuthRole[]): RequestHandler<Param> {
  return (_req: Request<Param>, res: Response, next: NextFunction) => {
    // No point decoding the JWT if authorisedRoles is empty
    if (authorisedRoles.length === 0) {
      return next()
    }

    const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }

    if (!roles.some(role => authorisedRoles.includes(role as AuthRole))) {
      logger.error('User is not authorised to access this')
      return res.redirect('/authError')
    }

    return next()
  }
}
