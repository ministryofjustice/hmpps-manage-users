import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'

import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from './authRoleGuardMiddleware'

function createToken(authorities: string[]) {
  const payload = {
    user_name: 'USER1',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}

describe('authRoleGuardMiddleware', () => {
  const req = {} as Request
  const next = jest.fn()

  function createResWithToken({ authorities }: { authorities: string[] }): Response {
    return {
      locals: {
        user: {
          token: createToken(authorities),
        },
      },
      redirect: jest.fn(),
    } as unknown as Response
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return next when authorised roles is empty', () => {
    const res = createResWithToken({ authorities: [AuthRole.CREATE_USER] })

    authRoleGuardMiddleware([])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should return next when user has one of the authorised roles', () => {
    const res = createResWithToken({ authorities: [AuthRole.CREATE_USER] })

    authRoleGuardMiddleware([AuthRole.CREATE_USER, AuthRole.MAINTAIN_ACCESS_ROLES])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect to authError if user has none of the authorised roles', () => {
    const res = createResWithToken({ authorities: [AuthRole.CREATE_USER] })

    authRoleGuardMiddleware([AuthRole.MANAGE_NOMIS_USER_ACCOUNT, AuthRole.MAINTAIN_ACCESS_ROLES])(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/authError')
  })
})
