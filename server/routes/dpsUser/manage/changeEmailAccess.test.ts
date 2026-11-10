import type { Request, Response } from 'express'
import { canChangeDpsUserEmail, changeEmailAccessGuard } from './changeEmailAccess'
import { userWithRoles } from '../../testutils/routerTestHelpers'
import AuthRole from '../../../interfaces/authRole'
import type { Services } from '../../../services'

const dpsUserService = { isAdministeredBy: jest.fn(), getDpsUser: jest.fn() }
const services = { dpsUserService } as unknown as Services

const generalUser = { username: 'TESTUSER', accountType: 'GENERAL' as const }
const adminUser = { username: 'TESTUSER', accountType: 'ADMIN' as const }

afterEach(() => {
  jest.resetAllMocks()
})

describe('canChangeDpsUserEmail', () => {
  it('allows an access roles admin without checking who administers the user', async () => {
    const hmppsUser = userWithRoles([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN])

    expect(await canChangeDpsUserEmail(hmppsUser, adminUser, services)).toBe(true)
    expect(dpsUserService.isAdministeredBy).not.toHaveBeenCalled()
  })

  it('denies a user without either access roles role', async () => {
    const hmppsUser = userWithRoles([AuthRole.ROLES_ADMIN])

    expect(await canChangeDpsUserEmail(hmppsUser, generalUser, services)).toBe(false)
    expect(dpsUserService.isAdministeredBy).not.toHaveBeenCalled()
  })

  it('denies a local administrator for a non-general account', async () => {
    const hmppsUser = userWithRoles([AuthRole.MAINTAIN_ACCESS_ROLES])

    expect(await canChangeDpsUserEmail(hmppsUser, adminUser, services)).toBe(false)
    expect(dpsUserService.isAdministeredBy).not.toHaveBeenCalled()
  })

  it.each([true, false])('returns %s for a local administrator when administered-by is %s', async administered => {
    const hmppsUser = userWithRoles([AuthRole.MAINTAIN_ACCESS_ROLES])
    dpsUserService.isAdministeredBy.mockResolvedValue(administered)

    expect(await canChangeDpsUserEmail(hmppsUser, generalUser, services)).toBe(administered)
    expect(dpsUserService.isAdministeredBy).toHaveBeenCalledWith(hmppsUser.token, 'TESTUSER')
  })

  it('denies a local administrator when the administered-by check fails', async () => {
    const hmppsUser = userWithRoles([AuthRole.MAINTAIN_ACCESS_ROLES])
    dpsUserService.isAdministeredBy.mockRejectedValue(new Error('boom'))

    expect(await canChangeDpsUserEmail(hmppsUser, generalUser, services)).toBe(false)
  })
})

describe('changeEmailAccessGuard', () => {
  const next = jest.fn()
  const redirect = jest.fn()
  const req = { params: { userId: 'TESTUSER' } } as unknown as Request<{ userId: string }>
  const resFor = (roles: string[]) => ({ locals: { user: userWithRoles(roles) }, redirect }) as unknown as Response

  it('lets an access roles admin through without loading the user', async () => {
    await changeEmailAccessGuard(services)(req, resFor([AuthRole.MAINTAIN_ACCESS_ROLES_ADMIN]), next)

    expect(next).toHaveBeenCalled()
    expect(dpsUserService.getDpsUser).not.toHaveBeenCalled()
  })

  it('lets a local administrator through for a user they administer', async () => {
    dpsUserService.getDpsUser.mockResolvedValue(generalUser)
    dpsUserService.isAdministeredBy.mockResolvedValue(true)

    await changeEmailAccessGuard(services)(req, resFor([AuthRole.MAINTAIN_ACCESS_ROLES]), next)

    expect(next).toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('redirects to the auth error page for a user they do not administer', async () => {
    dpsUserService.getDpsUser.mockResolvedValue(generalUser)
    dpsUserService.isAdministeredBy.mockResolvedValue(false)

    await changeEmailAccessGuard(services)(req, resFor([AuthRole.MAINTAIN_ACCESS_ROLES]), next)

    expect(redirect).toHaveBeenCalledWith('/authError')
    expect(next).not.toHaveBeenCalled()
  })
})
