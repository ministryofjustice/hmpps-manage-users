const { validateRoleName, validateRoleDescription } = require('./roleValidation')

describe('role name change validation', () => {
  it('should return errors if no fields specified', () => {
    expect(validateRoleName(null)).toEqual([{ href: '#roleName', text: 'Enter a role name' }])
  })
  it('should disallow fields that are too short', () => {
    expect(validateRoleName('b'.repeat(3))).toEqual([
      {
        href: '#roleName',
        text: 'Role name must be 4 characters or more',
      },
    ])
  })
  it('should disallow fields that are too long', () => {
    expect(validateRoleName('b'.repeat(101))).toEqual([
      {
        href: '#roleName',
        text: 'Role name must be 100 characters or less',
      },
    ])
  })
  it('should validate specific characters allowed', () => {
    expect(validateRoleName('b@c,d.com')).toEqual(
      expect.arrayContaining([
        { href: '#roleName', text: "Role name can only contain 0-9, a-z and ( ) & , - . '  characters" },
      ]),
    )
  })
  it('should pass role name validation', () => {
    expect(validateRoleName("good's & Role(),.-")).toEqual([])
  })
})

describe('role description change validation', () => {
  it('should allow no role description', () => {
    expect(validateRoleDescription(null)).toEqual([])
  })
  it('should disallow fields that are too long', () => {
    expect(validateRoleDescription('b'.repeat(1025))).toEqual([
      {
        href: '#roleDescription',
        text: 'Role description must be 1024 characters or less',
      },
    ])
  })
  it('should validate specific characters allowed', () => {
    expect(validateRoleDescription('b@c,d.com')).toEqual(
      expect.arrayContaining([
        { href: '#roleDescription', text: "Role description can only contain 0-9, a-z and ( ) & , - . '  characters" },
      ]),
    )
  })
  it('should pass role description validation', () => {
    expect(validateRoleDescription("good's & Role(),.-")).toEqual([])
  })
})
