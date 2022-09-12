import jwt from 'jsonwebtoken'
import type { Request, Response } from 'express'

import authorisationMiddleware from './authorisationMiddleware'

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

describe('authorisationMiddleware', () => {
  const req = { originalUrl: '/' } as Request
  const next = jest.fn()

  function createResWithToken({ authorities }: { authorities: string[] }): Response {
    return {
      locals: { access_token: createToken(authorities) },
      redirect: jest.fn(),
    } as unknown as Response
  }

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should return next when no required roles', () => {
    const res = createResWithToken({ authorities: [] })

    authorisationMiddleware()(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should return next when user has authorised role', async () => {
    const res = createResWithToken({ authorities: ['SOME_REQUIRED_ROLE'] })

    await authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.redirect).not.toHaveBeenCalled()
  })

  it('should redirect when user has no authorised roles', () => {
    const res = createResWithToken({ authorities: [] })

    authorisationMiddleware(['SOME_REQUIRED_ROLE'])(req, res, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.redirect).toHaveBeenCalledWith('/authError')
  })

  describe('select-caseloads', () => {
    it('should show correct page when user with correct role tries to access select-caseloads endpoint', () => {
      const reqCaseloads = { originalUrl: '/manage-dps-users/ITAG_USER/select-caseloads' } as Request
      const res = createResWithToken({ authorities: ['ROLE_MAINTAIN_ACCESS_ROLES_ADMIN'] })

      authorisationMiddleware([])(reqCaseloads, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.redirect).not.toHaveBeenCalled()
    })

    it('should redirect when user without correct role tries to access select-caseloads endpoint', () => {
      const reqCaseloads = { originalUrl: '/manage-dps-users/ITAG_USER/select-caseloads' } as Request
      const res = createResWithToken({ authorities: ['ROLE_WRONG_ROLE'] })

      authorisationMiddleware([])(reqCaseloads, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/authError')
    })
  })
  describe('create-user', () => {
    it('should show correct page when user with correct role tries to access create-user endpoint', () => {
      const reqCreateUser = { originalUrl: '/create-user' } as Request
      const res = createResWithToken({ authorities: ['ROLE_CREATE_USER'] })

      authorisationMiddleware([])(reqCreateUser, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.redirect).not.toHaveBeenCalled()
    })
    it('should redirect when user without correct role tries to access create-user endpoint', () => {
      const reqCreateUser = { originalUrl: '/create-user' } as Request
      const res = createResWithToken({ authorities: ['ROLE_WRONG_ROLE'] })

      authorisationMiddleware([])(reqCreateUser, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/authError')
    })
  })
  describe('create-dps-user', () => {
    it('should show correct page when user with correct role tries to access create-dps-user endpoint', () => {
      const reqCreateDpsUser = { originalUrl: '/create-dps-user' } as Request
      const res = createResWithToken({ authorities: ['ROLE_CREATE_USER'] })

      authorisationMiddleware([])(reqCreateDpsUser, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.redirect).not.toHaveBeenCalled()
    })
    it('should redirect when user without correct role tries to access create-dps-user endpoint', () => {
      const reqCreateDpsUser = { originalUrl: '/create-dps-user' } as Request
      const res = createResWithToken({ authorities: ['ROLE_WRONG_ROLE'] })

      authorisationMiddleware([])(reqCreateDpsUser, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/authError')
    })
  })
  describe('create-group', () => {
    it('should show correct page when user with correct role tries to access create-group endpoint', () => {
      const reqCreateGroup = { originalUrl: '/create-group' } as Request
      const res = createResWithToken({ authorities: ['ROLE_MAINTAIN_OAUTH_USERS'] })

      authorisationMiddleware([])(reqCreateGroup, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.redirect).not.toHaveBeenCalled()
    })
    it('should redirect when user without correct role tries to access create-group endpoint', () => {
      const reqCreateGroup = { originalUrl: '/create-group' } as Request
      const res = createResWithToken({ authorities: ['ROLE_WRONG_ROLE'] })

      authorisationMiddleware([])(reqCreateGroup, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/authError')
    })
  })

  describe('create-external-user', () => {
    it('should show correct page when user with correct role tries to access create-external-users endpoint', () => {
      const reqCreateExternalUsers = { originalUrl: '/create-external-user' } as Request
      const res = createResWithToken({ authorities: ['ROLE_AUTH_GROUP_MANAGER'] })

      authorisationMiddleware([])(reqCreateExternalUsers, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.redirect).not.toHaveBeenCalled()
    })
    it('should redirect when user without correct role tries to access create-external-users endpoint', () => {
      const reqCreateExternalUsers = { originalUrl: '/create-external-user' } as Request
      const res = createResWithToken({ authorities: ['ROLE_WRONG_ROLE'] })

      authorisationMiddleware([])(reqCreateExternalUsers, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/authError')
    })
  })

  describe('delete a group', () => {
    it('should show correct page when user with correct role tries to access delete group endpoint', () => {
      const reqDeleteGroup = { originalUrl: '/delete/children/none' } as Request
      const res = createResWithToken({ authorities: ['ROLE_MAINTAIN_OAUTH_USERS'] })

      authorisationMiddleware([])(reqDeleteGroup, res, next)

      expect(next).toHaveBeenCalled()
      expect(res.redirect).not.toHaveBeenCalled()
    })
    it('should redirect when user without correct role tries to access delete group endpoint', () => {
      const reqDeleteGroup = { originalUrl: '/delete/children/none' } as Request
      const res = createResWithToken({ authorities: ['ROLE_WRONG_ROLE'] })

      authorisationMiddleware([])(reqDeleteGroup, res, next)

      expect(next).not.toHaveBeenCalled()
      expect(res.redirect).toHaveBeenCalledWith('/authError')
    })
  })
})
