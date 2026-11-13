import jwt from 'jsonwebtoken'
import { flashProvider, user } from './appSetup'
import type { HmppsUser } from '../../interfaces/hmppsUser'

export type FlashStore = Record<string, unknown[]>

export const tokenWithRoles = (authorities: string[]): string =>
  jwt.sign({ authorities }, 'secret', { expiresIn: '1h' })

/**
 * Replaces the mocked req.flash with an in-memory version that behaves like connect-flash: writing appends, reading
 * returns and clears. Returns the backing store so tests can assert on what was flashed. Call from beforeEach, as
 * jest.resetAllMocks() removes the implementation.
 */
export const useInMemoryFlash = (): FlashStore => {
  const store: FlashStore = {}
  flashProvider.mockImplementation((key: string, value?: unknown) => {
    if (value === undefined) {
      const values = store[key] ?? []
      delete store[key]
      return values
    }
    store[key] = [...(store[key] ?? []), ...(Array.isArray(value) ? value : [value])]
    return store[key].length
  })
  return store
}

export const createAuditServiceMock = () => ({ logAuditEvent: jest.fn(), logPageView: jest.fn() })

/** A user whose token authorities and userRoles both contain the given roles (e.g. 'ROLE_ROLES_ADMIN'). */
export const userWithRoles = (roles: string[]): HmppsUser => ({
  ...user,
  token: tokenWithRoles(roles),
  userRoles: roles.map(role => role.replace(/^ROLE_/, '')),
})
