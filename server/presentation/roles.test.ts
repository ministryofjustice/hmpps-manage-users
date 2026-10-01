import { Role, UserRole } from 'manageUsersApiClient'
import {
  adminTypeItems,
  adminTypeItemsDisablingImmutable,
  adminTypeShorthand,
  asUrlSearchParams,
  filterCategories,
  Filter,
  roleDropdownValues,
  roleDropdownValuesWithHint,
} from './roles'
import paths from '../routes/paths'

describe('roles', () => {
  describe('roleDropdownValues', () => {
    test('maps roles to dropdown items', () => {
      const roles: Role[] = [
        {
          roleCode: 'ROLE_A',
          roleName: 'Role A',
          roleDescription: 'Role A description',
          adminType: [],
        },
      ]

      expect(roleDropdownValues(roles)).toEqual([{ text: 'Role A', value: 'ROLE_A' }])
    })
  })

  describe('roleDropdownValuesWithHint', () => {
    test('includes hints when a role has a description', () => {
      const roles: UserRole[] = [{ roleCode: 'ROLE_A', roleName: 'Role A', roleDescription: 'Role A description' }]

      expect(roleDropdownValuesWithHint(roles)).toEqual([
        {
          text: 'Role A',
          value: 'ROLE_A',
          hint: {
            text: 'Role A description',
          },
        },
      ])
    })

    test('omits hints when a role description is empty', () => {
      const roles: UserRole[] = [{ roleCode: 'ROLE_A', roleName: 'Role A', roleDescription: '' }]

      expect(roleDropdownValuesWithHint(roles)).toEqual([{ text: 'Role A', value: 'ROLE_A' }])
    })
  })

  describe('adminTypeItems', () => {
    test('returns all admin type items in declaration order', () => {
      expect(adminTypeItems()).toEqual([
        { value: 'EXT_ADM', text: 'External Administrators' },
        { value: 'DPS_LSA', text: 'DPS Local System Administrators (LSA)' },
        { value: 'DPS_ADM', text: 'DPS Central Admin' },
      ])
    })
  })

  describe('adminTypeItemsDisablingImmutable', () => {
    test('disables only immutable selected admin types', () => {
      expect(adminTypeItemsDisablingImmutable(['EXT_ADM', 'DPS_LSA'])).toEqual([
        { value: 'EXT_ADM', text: 'External Administrators', disabled: true },
        { value: 'DPS_LSA', text: 'DPS Local System Administrators (LSA)', disabled: false },
        { value: 'DPS_ADM', text: 'DPS Central Admin', disabled: false },
      ])
    })
  })

  describe('adminTypeShorthand', () => {
    test('returns the expected shorthand label', () => {
      expect(adminTypeShorthand('DPS_ADM')).toBe('DPS ADMIN')
    })
  })

  describe('asUrlSearchParams', () => {
    test('adds string fields to the search params', () => {
      const filter: Filter = {
        roleName: 'Role A',
        roleCode: 'ROLE_A',
        adminType: 'EXT_ADM',
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('roleName')).toBe('Role A')
      expect(params.get('roleCode')).toBe('ROLE_A')
      expect(params.get('adminType')).toBe('EXT_ADM')
    })

    test('omits undefined fields from the search params', () => {
      const filter: Filter = {
        roleName: 'Role A',
        roleCode: undefined,
      }

      const params = asUrlSearchParams(filter)

      expect(params.get('roleName')).toBe('Role A')
      expect(params.get('roleCode')).toBeNull()
      expect(params.get('adminType')).toBeNull()
    })
  })

  describe('filterCategories - href generation', () => {
    const searchUrl = paths.roles.list.pattern

    it('produces correct href for removing roleName filter', () => {
      const filter = { roleName: 'Role A', roleCode: 'ROLE_A' }
      const result = filterCategories(filter)

      const roleNameCategory = result[0]
      const { href } = roleNameCategory.items[0]

      expect(href).toBe(`${searchUrl}?roleCode=ROLE_A`)
    })

    it('produces correct href for removing roleCode filter', () => {
      const filter = { roleName: 'Role A', roleCode: 'ROLE_A' }
      const result = filterCategories(filter)

      const roleCodeCategory = result[1]
      const { href } = roleCodeCategory.items[0]

      expect(href).toBe(`${searchUrl}?roleName=Role+A`)
    })

    it('produces correct href and text for removing adminType filter', () => {
      const filter = { roleCode: 'ROLE_A', adminType: 'DPS_ADM' }
      const result = filterCategories(filter)

      const adminTypeCategory = result[1]
      const item = adminTypeCategory.items[0]

      expect(item.href).toBe(`${searchUrl}?roleCode=ROLE_A`)
      expect(item.text).toBe('DPS ADMIN')
    })

    it('omits the admin type category when the value is ALL', () => {
      const filter = { roleName: 'Role A', adminType: 'ALL' }

      expect(filterCategories(filter)).toEqual([
        {
          heading: { text: 'Role name' },
          items: [{ href: `${searchUrl}?adminType=ALL`, text: 'Role A' }],
        },
      ])
    })

    it('produces correct ordering and matching hrefs for all filters applied', () => {
      const filter = {
        roleName: 'Role A',
        roleCode: 'ROLE_A',
        adminType: 'EXT_ADM',
      }

      const result = filterCategories(filter)

      const hrefs = result.flatMap(category => category.items.map(item => item.href))

      expect(hrefs).toEqual([
        `${searchUrl}?roleCode=ROLE_A&adminType=EXT_ADM`,
        `${searchUrl}?roleName=Role+A&adminType=EXT_ADM`,
        `${searchUrl}?roleName=Role+A&roleCode=ROLE_A`,
      ])
    })
  })
})
