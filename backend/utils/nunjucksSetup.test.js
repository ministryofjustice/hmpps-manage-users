const express = require('express')
const path = require('path')
const nunjucksSetup = require('./nunjucksSetup')

describe('toExternalUserSearchFilter', () => {
  const app = express()
  const njk = nunjucksSetup(app, path)

  it('should show filter headings', () => {
    const result = njk.getFilter('toExternalUserSearchFilter')({}, [], [], '', true)
    expect(result.heading.text).toBe('Filters')
    expect(result.selectedFilters.clearLink.text).toBe('Clear filters')
  })

  describe('user filter', () => {
    it('should show current user filter section', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ user: 'Andy' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name')).toBeTruthy()
    })

    it('should not show current user filter section when no filter for users', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({}, [], [], '', true)
      expect(categoryWithHeading(result, 'Name')).toBeFalsy()
    })
    it('should have single user tag when user set in filter', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ user: 'Andy' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name').items).toHaveLength(1)
    })
    it('user tag should have text and reset url removing the user', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ user: 'Andy', status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name').items[0]).toStrictEqual({
        text: 'Andy',
        href: '/search-external-users?status=ACTIVE',
      })
    })
  })

  describe('status filter', () => {
    it('should show current status filter section', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status')).toBeTruthy()
    })
    it('should not show current status filter section when status not set in filter (AKA as ALL)', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({}, [], [], '', true)
      expect(categoryWithHeading(result, 'Status')).toBeFalsy()
    })
    it('should not show current status filter section when status set to ALL', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ status: 'ALL' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status')).toBeFalsy()
    })
    it('should have single status tag when status set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({ status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status').items).toHaveLength(1)
    })
    it('user tag should have text and reset url for removing the active status', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ user: 'Andy', status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status').items[0]).toStrictEqual({
        text: 'Active',
        href: '/search-external-users?user=Andy',
      })
    })
    it('user tag should have text and reset url for removing the inactive status', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ user: 'Andy', status: 'INACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status').items[0]).toStrictEqual({
        text: 'Inactive',
        href: '/search-external-users?user=Andy',
      })
    })
  })

  describe('group filter', () => {
    const groups = [
      { text: 'Group 1', value: 'GROUP_ONE' },
      { text: 'Group 2', value: 'GROUP_TWO' },
      { text: 'Group 3', value: 'GROUP_THREE' },
    ]
    it('should show current group filter section', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ groupCode: 'GROUP_ONE' }, groups, [], '', true)
      expect(categoryWithHeading(result, 'Group')).toBeTruthy()
    })
    it('should not show current group filter section when groups not set in filter', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({}, groups, [], '', true)
      expect(categoryWithHeading(result, 'Group')).toBeFalsy()
    })
    it('group tag should have text and reset url for removing the group', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')(
        { user: 'Andy', groupCode: 'GROUP_THREE' },
        groups,
        [],
        '',
        true,
      )
      expect(categoryWithHeading(result, 'Group').items[0]).toStrictEqual({
        text: 'Group 3',
        href: '/search-external-users?user=Andy',
      })
    })
  })

  describe('role filter', () => {
    const roles = [
      { text: 'Access Role Admin', value: 'ACCESS_ROLE_ADMIN' },
      { text: 'Access Role General', value: 'ACCESS_ROLE_GENERAL' },
      { text: 'Omic Admin', value: 'OMIC_ADMIN' },
    ]
    it('should show current role filter section', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({ roleCode: 'ACCESS_ROLE_ADMIN' }, [], roles, '', true)
      expect(categoryWithHeading(result, 'Role')).toBeTruthy()
    })
    it('should not show current role filter section when roles not set in filter', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')({}, [], roles, '', true)
      expect(categoryWithHeading(result, 'Role')).toBeFalsy()
    })
    it('role tag should have text and reset url for removing the role', () => {
      const result = njk.getFilter('toExternalUserSearchFilter')(
        { user: 'Andy', roleCode: 'ACCESS_ROLE_GENERAL' },
        [],
        roles,
        '',
        true,
      )
      expect(categoryWithHeading(result, 'Role').items[0]).toStrictEqual({
        text: 'Access Role General',
        href: '/search-external-users?user=Andy',
      })
    })
  })
})

describe('toUserSearchFilter', () => {
  const app = express()
  const njk = nunjucksSetup(app, path)
  it('should show filter headings', () => {
    const result = njk.getFilter('toUserSearchFilter')({}, [], [], '', true)
    expect(result.heading.text).toBe('Filters')
    expect(result.selectedFilters.clearLink.text).toBe('Clear filters')
  })

  describe('user filter', () => {
    it('should show current user filter section', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name')).toBeTruthy()
    })

    it('should not show current user filter section when no filter for users', () => {
      const result = njk.getFilter('toUserSearchFilter')({}, [], [], '', true)
      expect(categoryWithHeading(result, 'Name')).toBeFalsy()
    })
    it('should have single user tag when user set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name').items).toHaveLength(1)
    })
    it('user tag should have text and reset url removing the user', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy', status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name').items[0]).toStrictEqual({
        text: 'Andy',
        href: '/search-with-filter-dps-users?status=ACTIVE',
      })
    })
  })
  describe('status filter', () => {
    it('should show current status filter section', () => {
      const result = njk.getFilter('toUserSearchFilter')({ status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status')).toBeTruthy()
    })
    it('should not show current status filter section when status not set in filter (AKA as ALL)', () => {
      const result = njk.getFilter('toUserSearchFilter')({}, [], [], '', true)
      expect(categoryWithHeading(result, 'Status')).toBeFalsy()
    })
    it('should not show current status filter section when status set to ALL', () => {
      const result = njk.getFilter('toUserSearchFilter')({ status: 'ALL' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status')).toBeFalsy()
    })
    it('should have single status tag when status set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({ status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status').items).toHaveLength(1)
    })
    it('user tag should have text and reset url for removing the active status', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy', status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status').items[0]).toStrictEqual({
        text: 'Active',
        href: '/search-with-filter-dps-users?user=Andy',
      })
    })
    it('user tag should have text and reset url for removing the inactive status', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy', status: 'INACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Status').items[0]).toStrictEqual({
        text: 'Inactive',
        href: '/search-with-filter-dps-users?user=Andy',
      })
    })
  })

  describe('Local System Administrator filter', () => {
    it('should show LSA filter section', () => {
      const result = njk.getFilter('toUserSearchFilter')({ showOnlyLSAs: 'true' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Local System Administrator')).toBeTruthy()
    })
    it('should not show LSA filter section when showOnlyLSAs not set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({}, [], [], '', true)
      expect(categoryWithHeading(result, 'Local System Administrator')).toBeFalsy()
    })
    it('should have single show LSA tag when LSA set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({ showOnlyLSAs: 'true' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Local System Administrator').items).toHaveLength(1)
    })
    it('show LSA tag should have text and reset url for removing LSA filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy', showOnlyLSAs: 'true' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Local System Administrator').items[0]).toStrictEqual({
        text: 'Only',
        href: '/search-with-filter-dps-users?user=Andy',
      })
    })
  })

  describe('caseload filter', () => {
    const prisons = [
      { text: 'Birmingham', value: 'BMI' },
      { text: 'Brixton', value: 'BXI' },
      { text: 'Leeds', value: 'LEI' },
      { text: 'Moorland (HMP)', value: 'MDI' },
      { text: 'Mul', value: 'MUL' },
      { text: 'Ranby (HMP)', value: 'RNI' },
      { text: 'Shrewsbury', value: 'SYI' },
      { text: 'The Weare', value: 'WAI' },
      { text: 'Troom', value: 'TRO' },
    ]
    it('should show current caseload filter section', () => {
      const result = njk.getFilter('toUserSearchFilter')({ groupCode: ['MDI'] }, prisons, [], '', true)
      expect(categoryWithHeading(result, 'Prison')).toBeTruthy()
    })
    it('should not show current caseload filter section when user can see no caseloads', () => {
      const result = njk.getFilter('toUserSearchFilter')({ groupCode: ['MDI'] }, prisons, [], '', false)
      expect(categoryWithHeading(result, 'Prison')).toBeFalsy()
    })
    it('should not show current caseload filter section when caseload not set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({ restrictToActiveGroup: true }, prisons, [], '', true)
      expect(categoryWithHeading(result, 'Prison')).toBeFalsy()
    })
    it('should have single caseload tag when a single prison set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')(
        { groupCode: ['MDI'], restrictToActiveGroup: false },
        prisons,
        [],
        '',
        true,
      )
      expect(categoryWithHeading(result, 'Prison').items).toHaveLength(1)
    })
    it('should have additional caseload tag when a single prison set in filter with restrict to active caseload', () => {
      const result = njk.getFilter('toUserSearchFilter')(
        { groupCode: ['MDI'], restrictToActiveGroup: true },
        prisons,
        [],
        '',
        true,
      )
      expect(categoryWithHeading(result, 'Prison').items).toHaveLength(2)
    })
    it('caseload tag should have text and reset url for removing the prison', () => {
      const result = njk.getFilter('toUserSearchFilter')(
        { user: 'Andy', groupCode: ['MDI'], restrictToActiveGroup: true },
        prisons,
        [],
        '',
        true,
      )
      expect(categoryWithHeading(result, 'Prison').items[0]).toStrictEqual({
        text: 'Moorland (HMP)',
        href: '/search-with-filter-dps-users?user=Andy',
      })
      expect(categoryWithHeading(result, 'Prison').items[1]).toStrictEqual({
        text: 'Active caseload only',
        href: '/search-with-filter-dps-users?user=Andy&groupCode=MDI&restrictToActiveGroup=false',
      })
    })
    it('caseload tag should have text and reset url for removing the prison when multiple prisons set', () => {
      const result = njk.getFilter('toUserSearchFilter')(
        { user: 'Andy', groupCode: ['MDI', 'RNI'], restrictToActiveGroup: true },
        prisons,
        [],
        '',
        true,
      )
      expect(categoryWithHeading(result, 'Prison').items[0]).toStrictEqual({
        text: 'Moorland (HMP)',
        href: '/search-with-filter-dps-users?user=Andy&restrictToActiveGroup=true&groupCode=RNI',
      })
      expect(categoryWithHeading(result, 'Prison').items[1]).toStrictEqual({
        text: 'Ranby (HMP)',
        href: '/search-with-filter-dps-users?user=Andy&restrictToActiveGroup=true&groupCode=MDI',
      })
      expect(categoryWithHeading(result, 'Prison').items[2]).toStrictEqual({
        text: 'Active caseload only',
        href: '/search-with-filter-dps-users?user=Andy&groupCode=MDI&groupCode=RNI&restrictToActiveGroup=false',
      })
    })
  })

  describe('role filter', () => {
    const roles = [
      { text: 'Access Role Admin', value: 'ACCESS_ROLE_ADMIN' },
      { text: 'Access Role General', value: 'ACCESS_ROLE_GENERAL' },
      { text: 'Omic Admin', value: 'OMIC_ADMIN' },
    ]
    it('should show current role filter section', () => {
      const result = njk.getFilter('toUserSearchFilter')({ roleCode: ['ACCESS_ROLE_ADMIN'] }, [], roles, '', true)
      expect(categoryWithHeading(result, 'Roles')).toBeTruthy()
    })

    it('should not show current role filter section when roles not set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({}, [], roles, '', true)
      expect(categoryWithHeading(result, 'Roles')).toBeFalsy()
    })
    it('should have single role tag when a single role set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({ roleCode: ['ACCESS_ROLE_ADMIN'] }, [], roles, '', true)
      expect(categoryWithHeading(result, 'Roles').items).toHaveLength(1)
    })
    it('role tag should have text and reset url for removing the role', () => {
      const result = njk.getFilter('toUserSearchFilter')(
        { user: 'Andy', roleCode: ['ACCESS_ROLE_ADMIN'] },
        [],
        roles,
        '',
        true,
      )
      expect(categoryWithHeading(result, 'Roles').items[0]).toStrictEqual({
        text: 'Access Role Admin',
        href: '/search-with-filter-dps-users?user=Andy',
      })
    })
    it('role tag should have text and reset url for removing the role when multiple roles set', () => {
      const result = njk.getFilter('toUserSearchFilter')(
        { user: 'Andy', roleCode: ['ACCESS_ROLE_ADMIN', 'ACCESS_ROLE_GENERAL'] },
        [],
        roles,
        '',
        true,
      )
      expect(categoryWithHeading(result, 'Roles').items[0]).toStrictEqual({
        text: 'Access Role Admin',
        href: '/search-with-filter-dps-users?user=Andy&roleCode=ACCESS_ROLE_GENERAL',
      })
      expect(categoryWithHeading(result, 'Roles').items[1]).toStrictEqual({
        text: 'Access Role General',
        href: '/search-with-filter-dps-users?user=Andy&roleCode=ACCESS_ROLE_ADMIN',
      })
    })
  })
})

describe('roleFilter', () => {
  const app = express()
  const njk = nunjucksSetup(app, path)
  it('should show filter headings', () => {
    const result = njk.getFilter('roleFilter')({}, [], [], '', true)
    expect(result.heading.text).toBe('Filters')
    expect(result.selectedFilters.clearLink.text).toBe('Clear filters')
  })

  describe('role name filter', () => {
    it('should show current role name filter section', () => {
      const result = njk.getFilter('roleFilter')({ roleName: 'HWPV' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Role name')).toBeTruthy()
    })
  })
  it('should not show current role name filter section when no filter for role name', () => {
    const result = njk.getFilter('roleFilter')({}, [], [], '', true)
    expect(categoryWithHeading(result, 'Role name')).toBeFalsy()
  })
  it('should have single user tag when role code set in filter', () => {
    const result = njk.getFilter('roleFilter')({ roleName: 'HWPV' }, [], [], '', true)
    expect(categoryWithHeading(result, 'Role name').items).toHaveLength(1)
  })
  it('role name tag should have text and reset url removing the user', () => {
    const result = njk.getFilter('roleFilter')({ roleName: 'HWPV', adminTypes: 'ALL' }, [], [], '', true)
    expect(categoryWithHeading(result, 'Role name').items[0]).toStrictEqual({
      text: 'HWPV',
      href: '/manage-roles?adminTypes=ALL',
    })
  })

  describe('role code filter', () => {
    it('should show current role code filter section', () => {
      const result = njk.getFilter('roleFilter')({ roleCode: 'HWPV' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Role code')).toBeTruthy()
    })
  })
  it('should not show current role code filter section when no filter for role code', () => {
    const result = njk.getFilter('roleFilter')({}, [], [], '', true)
    expect(categoryWithHeading(result, 'Role code')).toBeFalsy()
  })
  it('should have single user tag when role code set in filter', () => {
    const result = njk.getFilter('roleFilter')({ roleCode: 'HWPV' }, [], [], '', true)
    expect(categoryWithHeading(result, 'Role code').items).toHaveLength(1)
  })
  it('role code tag should have text and reset url removing the user', () => {
    const result = njk.getFilter('roleFilter')({ roleCode: 'HWPV', adminTypes: 'ALL' }, [], [], '', true)
    expect(categoryWithHeading(result, 'Role code').items[0]).toStrictEqual({
      text: 'HWPV',
      href: '/manage-roles?adminTypes=ALL',
    })
  })

  describe('admin type filter', () => {
    it('should not show current role administrator filter section when status not set in filter (AKA as ALL)', () => {
      const result = njk.getFilter('roleFilter')({}, [], [], '', true)
      expect(categoryWithHeading(result, 'Role administrator')).toBeFalsy()
    })
    it('should not show current  role administrator filter section when status set to ALL', () => {
      const result = njk.getFilter('roleFilter')({ adminTypes: 'ALL' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Role administrator')).toBeFalsy()
    })
    it('should have single  role administrator tag when status set in filter', () => {
      const result = njk.getFilter('roleFilter')({ adminTypes: 'EXT_ADM' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Role administrator').items).toHaveLength(1)
    })
    it('role code tag should have text and reset url for removing the EXT_ADM role administrator', () => {
      const result = njk.getFilter('roleFilter')({ roleCode: 'HWPV', adminTypes: 'EXT_ADM' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Role administrator').items[0]).toStrictEqual({
        text: 'EXT_ADM',
        href: '/manage-roles?roleCode=HWPV',
      })
    })
    it('role code tag should have text and reset url for removing the DPS_ADM role administrator', () => {
      const result = njk.getFilter('roleFilter')({ roleCode: 'HWPV', adminTypes: 'DPS_ADM' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Role administrator').items[0]).toStrictEqual({
        text: 'DPS_ADM',
        href: '/manage-roles?roleCode=HWPV',
      })
    })
    it('role code tag should have text and reset url for removing the DPS_LSA role administrator', () => {
      const result = njk.getFilter('roleFilter')({ roleCode: 'HWPV', adminTypes: 'DPS_LSA' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Role administrator').items[0]).toStrictEqual({
        text: 'DPS_LSA',
        href: '/manage-roles?roleCode=HWPV',
      })
    })
  })
})

function categoryWithHeading(result, title) {
  const { categories } = result.selectedFilters
  return categories.find((section) => section.heading.text === title)
}
