import { validateRoleCode, validateRoleName, validateRoleDescription, validateRoleAdminType } from './roleValidation'
import { FormError } from '../../interfaces/formError'

describe('validateRoleName', () => {
  it('returns error when role name is missing', () => {
    const result = validateRoleName('')
    expect(result).toEqual<FormError[]>([{ href: '#roleName', text: 'Enter a role name' }])
  })

  it('returns error when role name is less than 4 characters', () => {
    const result = validateRoleName('xxx')
    expect(result).toEqual<FormError[]>([
      {
        href: '#roleName',
        text: 'Role name must be 4 characters or more',
      },
    ])
  })

  it('accepts 4 characters', () => {
    const result = validateRoleName('xxxx')
    expect(result).toEqual([])
  })

  it('returns error when role name is longer than than 100 characters', () => {
    const result = validateRoleName('x'.repeat(101))
    expect(result).toEqual<FormError[]>([
      {
        href: '#roleName',
        text: 'Role name must be 100 characters or less',
      },
    ])
  })

  it('accepts 100 characters', () => {
    const result = validateRoleName('x'.repeat(10))
    expect(result).toEqual([])
  })

  it('returns error when role name has invalid characters', () => {
    const result = validateRoleName('*%Test^Role')
    expect(result).toEqual<FormError[]>([
      {
        href: '#roleName',
        text: "Role name can only contain 0-9, a-z and ( ) & , - . ' characters",
      },
    ])
  })

  it('returns no errors for valid roleName', () => {
    const result = validateRoleName('Test role name')
    expect(result).toEqual([])
  })
})

describe('validateRoleCode', () => {
  it('returns error when role code is missing', () => {
    const result = validateRoleCode('')
    expect(result).toEqual<FormError[]>([{ href: '#roleCode', text: 'Enter a role code' }])
  })

  it('returns error when role code is less than 2 characters', () => {
    const result = validateRoleCode('X')
    expect(result).toEqual<FormError[]>([{ href: '#roleCode', text: 'Role code must be 2 characters or more' }])
  })

  it('accepts 2 characters', () => {
    const result = validateRoleCode('XX')
    expect(result).toEqual([])
  })

  it('returns error when role code is too long', () => {
    const result = validateRoleCode('X'.repeat(31))
    expect(result).toEqual<FormError[]>([{ href: '#roleCode', text: 'Role code must be 30 characters or less' }])
  })

  it('accepts 30 characters', () => {
    const result = validateRoleCode('X'.repeat(30))
    expect(result).toEqual([])
  })

  it('returns error when role code has lowercase characters', () => {
    const result = validateRoleCode('test_role')
    expect(result).toEqual<FormError[]>([
      { href: '#roleCode', text: 'Role code can only contain 0-9, A-Z and _ characters' },
    ])
  })

  it('returns error when role code has invalid characters', () => {
    const result = validateRoleCode('&TEST_ROLE*')
    expect(result).toEqual<FormError[]>([
      { href: '#roleCode', text: 'Role code can only contain 0-9, A-Z and _ characters' },
    ])
  })

  it('returns no errors for valid roleCode', () => {
    const result = validateRoleCode('TEST_ROLE_CODE')
    expect(result).toEqual([])
  })
})

describe('validateRoleDescription', () => {
  it('returns empty array when description is empty', () => {
    const result = validateRoleDescription('')
    expect(result).toEqual([])
  })

  it('returns error when role description has invalid characters', () => {
    const result = validateRoleDescription('&Test description*')
    expect(result).toEqual<FormError[]>([
      {
        href: '#roleDescription',
        text: "Role description can only contain 0-9, a-z, newline and ( ) & , - . ' characters",
      },
    ])
  })

  it('returns error when role code is too long', () => {
    const result = validateRoleDescription('x'.repeat(1025))
    expect(result).toEqual<FormError[]>([
      { href: '#roleDescription', text: 'Role description must be 1024 characters or less' },
    ])
  })

  it('accepts 1024 characters', () => {
    const result = validateRoleDescription('x'.repeat(1024))
    expect(result).toEqual([])
  })

  it('returns no errors for valid description', () => {
    const result = validateRoleDescription('Test description')
    expect(result).toEqual([])
  })
})

describe('validateRoleAdminType', () => {
  it('returns error when admin type is empty', () => {
    const result = validateRoleAdminType([])
    expect(result).toEqual<FormError[]>([
      {
        href: '#adminType',
        text: 'Select an admin type',
      },
    ])
  })

  it('returns no errors for valid admin type', () => {
    const result = validateRoleAdminType(['EXT_ADM'])
    expect(result).toEqual([])
  })
})
