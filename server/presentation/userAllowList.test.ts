import type { UserAllowlistDetail } from 'manageUsersApiClient'
import { HmppsUser } from '../interfaces/hmppsUser'
import {
  asUrlSearchParams,
  canDownload,
  displayUsers,
  filterCategories,
  Filter,
  getAllowlistStatus,
} from './userAllowList'
import paths from '../routes/paths'

describe('searchUserAllowList', () => {
  const buildAllowlistUser = (overrides: Partial<UserAllowlistDetail> = {}): UserAllowlistDetail => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    username: 'alice',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    reason: 'Access required',
    createdOn: '2026-07-01T10:00:00.000Z',
    allowlistEndDate: '2026-07-25',
    lastUpdated: '2026-07-01T10:00:00.000Z',
    lastUpdatedBy: 'SYSTEM',
    ...overrides,
  })

  describe('asUrlSearchParams', () => {
    test('adds string fields to the search params', () => {
      const filter: Filter = {
        user: 'alice',
        status: 'ACTIVE',
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('user')).toBe('alice')
      expect(params.get('status')).toBe('ACTIVE')
    })
  })

  describe('filterCategories', () => {
    it('produces correct hrefs for removing filters', () => {
      const filter = { user: 'bob', status: 'ACTIVE' }

      const result = filterCategories(filter)

      expect(result[0].items[0].href).toBe(`${paths.userAllowList.search.pattern}?status=ACTIVE`)
      expect(result[1].items[0].href).toBe(`${paths.userAllowList.search.pattern}?user=bob`)
    })
  })

  describe('canDownload', () => {
    it('returns true for the allow list role', () => {
      const user: HmppsUser = {
        authSource: 'nomis',
        username: 'test',
        userId: '1',
        userUuid: '447672e4-70ed-459e-a8ce-b6098d9f35a3',
        name: 'Test User',
        displayName: 'Test User',
        userRoles: ['MANAGE_USER_ALLOW_LIST'],
        token: 'token',
        staffId: 1,
      }

      expect(canDownload(user)).toBe(true)
    })

    it('returns false for other users', () => {
      const user: HmppsUser = {
        authSource: 'nomis',
        username: 'test',
        userId: '1',
        userUuid: '447672e4-70ed-459e-a8ce-b6098d9f35a3',
        name: 'Test User',
        displayName: 'Test User',
        userRoles: ['MAINTAIN_OAUTH_USERS'],
        token: 'token',
        staffId: 1,
      }

      expect(canDownload(user)).toBe(false)
    })
  })

  describe('getAllowlistStatus', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2026-07-24T12:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('returns expired for an allowlist end date before today', () => {
      expect(getAllowlistStatus(buildAllowlistUser({ allowlistEndDate: '2026-07-23' }))).toBe('EXPIRED')
    })

    it('returns active for an allowlist end date today or later', () => {
      expect(getAllowlistStatus(buildAllowlistUser({ allowlistEndDate: '2026-07-24' }))).toBe('ACTIVE')
    })
  })

  describe('displayUsers', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2026-07-24T12:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('adds a derived status to each allowlist user', () => {
      const users = [
        buildAllowlistUser({ username: 'alice', allowlistEndDate: '2026-07-24' }),
        buildAllowlistUser({ username: 'bob', allowlistEndDate: '2026-07-23' }),
      ]

      expect(displayUsers(users)).toEqual([
        { ...users[0], status: 'ACTIVE' },
        { ...users[1], status: 'EXPIRED' },
      ])
    })
  })
})
