import { PrisonCaseload, Role } from 'manageUsersApiClient'
import { asUrlSearchParams, filterCategories, Filter } from './searchDpsUser'
import paths from '../routes/paths'

describe('searchDpsUser', () => {
  describe('asUrlSearchParams', () => {
    test('adds string fields to the search params', () => {
      const filter: Filter = {
        user: 'alice',
        status: 'active',
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('user')).toBe('alice')
      expect(params.get('status')).toBe('active')
    })

    test('converts boolean fields and adds to the search params', () => {
      const filter: Filter = {
        restrictToActiveGroup: true,
        showOnlyLSAs: false,
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('restrictToActiveGroup')).toBe('true')
      expect(params.get('showOnlyLSAs')).toBe('false')
    })

    test('omits undefined fields from the search params', () => {
      const filter: Filter = {
        user: 'alice',
        status: undefined,
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('user')).toBe('alice')
      expect(params.get('status')).toBeNull()
    })

    test('appends multiple roleCode values separately', () => {
      const filter: Filter = {
        roleCode: ['ROLE_ADMIN', 'ROLE_EDITOR'],
      }

      const params = asUrlSearchParams(filter)

      expect(params.getAll('roleCode')).toEqual(['ROLE_ADMIN', 'ROLE_EDITOR'])
    })

    test('correctly stringifies groupCode', () => {
      const filter: Filter = {
        groupCode: 'GROUP-123',
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('groupCode')).toBe('GROUP-123')
    })
  })

  describe('filterCategories - href generation', () => {
    const roles: Role[] = [
      { roleCode: 'A', roleName: 'Alpha' },
      { roleCode: 'B', roleName: 'Beta' },
    ]

    const prisons: PrisonCaseload[] = [
      { id: 'MDI', name: 'Moorland' },
      { id: 'LEI', name: 'Leeds' },
    ]

    const searchUrl = paths.dpsUser.search.pattern

    it('produces correct href for removing user filter', () => {
      const filter = { user: 'bob', status: 'ACTIVE' }
      const result = filterCategories(filter, roles, prisons, false)

      const userCategory = result[0]
      const { href } = userCategory.items[0]

      expect(href).toBe(`${searchUrl}?status=ACTIVE`)
    })

    it('produces correct href for removing status filter', () => {
      const filter = { user: 'bob', status: 'ACTIVE' }
      const result = filterCategories(filter, roles, prisons, false)

      const statusCategory = result[1]
      const { href } = statusCategory.items[0]

      expect(href).toBe(`${searchUrl}?user=bob`)
    })

    it('removes groupCode AND restrictToActiveGroup when removing groupCode', () => {
      const filter = { groupCode: 'MDI', restrictToActiveGroup: true }
      const result = filterCategories(filter, roles, prisons, true)

      const prisonCategory = result[0]
      const { href } = prisonCategory.items[0]

      // groupCode removed, restrictToActiveGroup removed => empty query string
      expect(href).toBe(`${searchUrl}?`)
    })

    it('produces correct href for removing only restrictToActiveGroup', () => {
      const filter = { groupCode: 'MDI', restrictToActiveGroup: true }
      const result = filterCategories(filter, roles, prisons, true)

      const prisonCategory = result[0]
      const { href } = prisonCategory.items[1]

      // restrictToActiveGroup is set to false here instead of being removed
      expect(href).toBe(`${searchUrl}?groupCode=MDI&restrictToActiveGroup=false`)
    })

    it('correctly removes a single roleCode from a multi-role array', () => {
      const filter = { roleCode: ['A', 'B'] }
      const result = filterCategories(filter, roles, prisons, false)

      const rolesCategory = result[0]

      // Remove role A
      expect(rolesCategory.items[0].href).toBe(`${searchUrl}?roleCode=B`)

      // Remove role B
      expect(rolesCategory.items[1].href).toBe(`${searchUrl}?roleCode=A`)
    })

    it('correctly removes inclusiveRoles flag', () => {
      const filter = { inclusiveRoles: true, roleCode: ['A'] }
      const result = filterCategories(filter, roles, prisons, false)

      const inclusiveCategory = result[1] // order: Roles, then Role match
      const { href } = inclusiveCategory.items[0]

      expect(href).toBe(`${searchUrl}?roleCode=A`)
    })

    it('correctly removes showOnlyLSAs flag', () => {
      const filter = { showOnlyLSAs: true, user: 'bob' }
      const result = filterCategories(filter, roles, prisons, false)

      const lsaCategory = result[1]
      const { href } = lsaCategory.items[0]

      expect(href).toBe(`${searchUrl}?user=bob`)
    })

    it('produces correct ordering and matching hrefs for all filters applied', () => {
      const filter = {
        user: 'bob',
        status: 'ACTIVE',
        groupCode: 'MDI',
        roleCode: ['A'],
        inclusiveRoles: true,
        showOnlyLSAs: true,
      }

      const result = filterCategories(filter, roles, prisons, true)

      const hrefs = result.flatMap(c => c.items.map(i => i.href))

      expect(hrefs).toEqual([
        `${searchUrl}?status=ACTIVE&groupCode=MDI&inclusiveRoles=true&showOnlyLSAs=true&roleCode=A`, // remove user
        `${searchUrl}?user=bob&groupCode=MDI&inclusiveRoles=true&showOnlyLSAs=true&roleCode=A`, // remove status
        `${searchUrl}?user=bob&status=ACTIVE&inclusiveRoles=true&showOnlyLSAs=true&roleCode=A`, // remove groupCode
        `${searchUrl}?user=bob&status=ACTIVE&groupCode=MDI&inclusiveRoles=true&showOnlyLSAs=true`, // remove role A
        `${searchUrl}?user=bob&status=ACTIVE&groupCode=MDI&showOnlyLSAs=true&roleCode=A`, // remove inclusiveRoles
        `${searchUrl}?user=bob&status=ACTIVE&groupCode=MDI&inclusiveRoles=true&roleCode=A`, // remove showOnlyLSAs
      ])
    })
  })
})
