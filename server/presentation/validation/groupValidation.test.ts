import { validateGroupCode, validateGroupName } from './groupValidation'
import { FormError } from '../../interfaces/formError'

describe('validateGroupName', () => {
  it('returns error when group name is missing', () => {
    const result = validateGroupName('')
    expect(result).toEqual<FormError[]>([{ href: '#groupName', text: 'Enter a group name' }])
  })

  it('returns error when group name is less than 4 characters', () => {
    const result = validateGroupName('xxx')
    expect(result).toEqual<FormError[]>([
      {
        href: '#groupName',
        text: 'Group name must be 4 characters or more',
      },
    ])
  })

  it('returns error when group name is longer than than 100 characters', () => {
    const result = validateGroupName('x'.repeat(101))
    expect(result).toEqual<FormError[]>([
      {
        href: '#groupName',
        text: 'Group name must be 100 characters or less',
      },
    ])
  })

  it('returns error when group name has invalid characters', () => {
    const result = validateGroupName('*%Test^Group')
    expect(result).toEqual<FormError[]>([
      {
        href: '#groupName',
        text: "Group name can only contain 0-9, a-z and ( ) & , - . ' characters",
      },
    ])
  })

  it('returns no errors for valid groupName', () => {
    const result = validateGroupName('Test group name')
    expect(result).toEqual([])
  })
})

describe('validateGroupCode', () => {
  it('returns error when group code is missing', () => {
    const result = validateGroupCode('')
    expect(result).toEqual<FormError[]>([{ href: '#groupCode', text: 'Enter a group code' }])
  })

  it('returns error when group code is less than 2 characters', () => {
    const result = validateGroupCode('X')
    expect(result).toEqual<FormError[]>([{ href: '#groupCode', text: 'Group code must be 2 characters or more' }])
  })

  it('returns error when group code is too long', () => {
    const result = validateGroupCode('X'.repeat(31))
    expect(result).toEqual<FormError[]>([{ href: '#groupCode', text: 'Group code must be 30 characters or less' }])
  })

  it('returns error when group code has lowercase characters', () => {
    const result = validateGroupCode('test_group')
    expect(result).toEqual<FormError[]>([
      { href: '#groupCode', text: 'Group code can only contain 0-9, A-Z and _ characters' },
    ])
  })

  it('returns error when group code has invalid characters', () => {
    const result = validateGroupCode('&TEST_GROUP*')
    expect(result).toEqual<FormError[]>([
      { href: '#groupCode', text: 'Group code can only contain 0-9, A-Z and _ characters' },
    ])
  })

  it('returns no errors for valid groupCode', () => {
    const result = validateGroupCode('TEST_GROUP_CODE')
    expect(result).toEqual([])
  })
})
