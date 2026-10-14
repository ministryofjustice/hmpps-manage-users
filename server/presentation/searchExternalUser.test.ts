import { UserGroup, UserRole } from 'manageUsersApiClient'
import { asUrlSearchParams, filterCategories, Filter } from './searchExternalUser'
import paths from '../routes/paths'

describe('searchExternalUser', () => {
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

    test('omits undefined fields from the search params', () => {
      const filter: Filter = {
        user: 'alice',
        status: undefined,
        roleCode: undefined,
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('user')).toBe('alice')
      expect(params.get('status')).toBeNull()
      expect(params.get('roleCode')).toBeNull()
    })

    test('correctly stringifies roleCode and groupCode', () => {
      const filter: Filter = {
        roleCode: 'ROLE_ADMIN',
        groupCode: 'GROUP_123',
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('roleCode')).toBe('ROLE_ADMIN')
      expect(params.get('groupCode')).toBe('GROUP_123')
    })
  })

  describe('filterCategories - href generation', () => {
    const roles: UserRole[] = [{ roleCode: 'A', roleName: 'Alpha', roleDescription: 'Alpha role' }]

    const groups: UserGroup[] = [{ groupCode: 'GROUP_A', groupName: 'Group Alpha' }]

    const searchUrl = paths.externalUser.search.pattern

    it('produces correct href for removing user filter', () => {
      const filter = { user: 'bob', status: 'ACTIVE' }
      const result = filterCategories(filter, roles, groups)

      const userCategory = result[0]
      const { href } = userCategory.items[0]

      expect(href).toBe(`${searchUrl}?status=ACTIVE`)
    })

    it('produces correct href for removing status filter', () => {
      const filter = { user: 'bob', status: 'ACTIVE' }
      const result = filterCategories(filter, roles, groups)

      const statusCategory = result[1]
      const { href } = statusCategory.items[0]

      expect(href).toBe(`${searchUrl}?user=bob`)
    })

    it('produces correct href for removing groupCode', () => {
      const filter = { groupCode: 'GROUP_A', status: 'ACTIVE' }
      const result = filterCategories(filter, roles, groups)

      const groupCategory = result[1]
      const { href } = groupCategory.items[0]

      expect(href).toBe(`${searchUrl}?status=ACTIVE`)
    })

    it('produces correct href for removing roleCode', () => {
      const filter = { roleCode: 'A', user: 'bob' }
      const result = filterCategories(filter, roles, groups)

      const roleCategory = result[1]
      const { href } = roleCategory.items[0]

      expect(href).toBe(`${searchUrl}?user=bob`)
    })

    it('produces correct ordering and matching hrefs for all filters applied', () => {
      const filter = {
        user: 'bob',
        status: 'ACTIVE',
        groupCode: 'GROUP_A',
        roleCode: 'A',
      }

      const result = filterCategories(filter, roles, groups)

      const hrefs = result.flatMap(category => category.items.map(item => item.href))

      expect(hrefs).toEqual([
        `${searchUrl}?status=ACTIVE&groupCode=GROUP_A&roleCode=A`,
        `${searchUrl}?user=bob&groupCode=GROUP_A&roleCode=A`,
        `${searchUrl}?user=bob&status=ACTIVE&roleCode=A`,
        `${searchUrl}?user=bob&status=ACTIVE&groupCode=GROUP_A`,
      ])
    })
  })
})
