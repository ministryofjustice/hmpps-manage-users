import {
  userTypeDisplay,
  showCaseloadDropdown,
  caseloadText,
  userTypeExistingUsernameLabel,
  userTypeExistingUsernameHint,
  userTypeShorthand,
  userTypeItems,
} from './userType'
import { SelectItem } from '../interfaces/selectItem'

describe('userTypes utilities', () => {
  describe('userTypeDisplay', () => {
    it('returns correct display text for each user type', () => {
      expect(userTypeDisplay('DPS_ADM')).toBe('Central Admin')
      expect(userTypeDisplay('DPS_GEN')).toBe('General')
      expect(userTypeDisplay('DPS_LSA')).toBe('Local System Administrator (LSA)')
    })
  })

  describe('showCaseloadDropdown', () => {
    it('hides dropdown for DPS_ADM', () => {
      expect(showCaseloadDropdown('DPS_ADM')).toBe(false)
    })

    it('shows dropdown for other user types', () => {
      expect(showCaseloadDropdown('DPS_GEN')).toBe(true)
      expect(showCaseloadDropdown('DPS_LSA')).toBe(true)
    })
  })

  describe('caseloadText', () => {
    it('returns caseload text for non-LSA users', () => {
      expect(caseloadText('DPS_ADM')).toBe('Select a default caseload')
      expect(caseloadText('DPS_GEN')).toBe('Select a default caseload')
    })

    it('returns local admin group text for LSA', () => {
      expect(caseloadText('DPS_LSA')).toBe('Select a default local admin group')
    })
  })

  describe('userTypeExistingUsernameLabel', () => {
    it('returns "Existing Admin Username" for DPS_GEN', () => {
      expect(userTypeExistingUsernameLabel('DPS_GEN')).toBe('Existing Admin Username')
    })

    it('returns "Existing Username" for others', () => {
      expect(userTypeExistingUsernameLabel('DPS_ADM')).toBe('Existing Username')
      expect(userTypeExistingUsernameLabel('DPS_LSA')).toBe('Existing Username')
    })
  })

  describe('userTypeExistingUsernameHint', () => {
    it('includes "admin" for DPS_GEN', () => {
      expect(userTypeExistingUsernameHint('DPS_GEN')).toBe(
        'Search and populate existing admin user details by username',
      )
    })

    it('includes "general" for other types', () => {
      expect(userTypeExistingUsernameHint('DPS_ADM')).toBe(
        'Search and populate existing general user details by username',
      )
      expect(userTypeExistingUsernameHint('DPS_LSA')).toBe(
        'Search and populate existing general user details by username',
      )
    })
  })

  describe('userTypeShorthand', () => {
    it('returns correct shorthand for each type', () => {
      expect(userTypeShorthand('DPS_ADM')).toBe('Admin')
      expect(userTypeShorthand('DPS_GEN')).toBe('General')
      expect(userTypeShorthand('DPS_LSA')).toBe('LSA')
    })
  })

  describe('userTypeItems', () => {
    it('returns SelectItem objects for all user types', () => {
      const items = userTypeItems()

      expect(items).toHaveLength(3)

      expect(items).toContainEqual<SelectItem>({
        value: 'DPS_ADM',
        text: 'Central Admin',
      })

      expect(items).toContainEqual<SelectItem>({
        value: 'DPS_GEN',
        text: 'General',
      })

      expect(items).toContainEqual<SelectItem>({
        value: 'DPS_LSA',
        text: 'Local System Administrator (LSA)',
      })
    })
  })
})
