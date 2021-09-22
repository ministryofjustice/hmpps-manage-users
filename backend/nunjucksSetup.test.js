const express = require('express')
const path = require('path')
const nunjucksSetup = require('./nunjucksSetup')

describe('toUserSearchFilter', () => {
  const app = express()
  const njk = nunjucksSetup(app, path)
  it('should show filter headings', () => {
    const result = njk.getFilter('toUserSearchFilter')({}, [], [], '', true)
    expect(result.heading.text).toBe('Filter')
    expect(result.selectedFilters.clearLink.text).toBe('Clear filters')
  })

  describe('user filter', () => {
    it('should show current user filter section', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name or username')).toBeTruthy()
    })

    it('should not show current user filter section when no filter for users', () => {
      const result = njk.getFilter('toUserSearchFilter')({}, [], [], '', true)
      expect(categoryWithHeading(result, 'Name or username')).toBeFalsy()
    })
    it('should have single user tag when user set in filter', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name or username').items).toHaveLength(1)
    })
    it('user tag should have text and reset url removing the user', () => {
      const result = njk.getFilter('toUserSearchFilter')({ user: 'Andy', status: 'ACTIVE' }, [], [], '', true)
      expect(categoryWithHeading(result, 'Name or username').items[0]).toStrictEqual({
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

function categoryWithHeading(result, title) {
  const { categories } = result.selectedFilters
  return categories.find((section) => section.heading.text === title)
}
