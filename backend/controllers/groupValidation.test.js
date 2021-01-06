const { validateGroupName } = require('./groupValidation')

describe('Auth change email validation', () => {
  it('should return errors if no fields specified', () => {
    expect(validateGroupName(null)).toEqual([{ href: '#groupName', text: 'Enter a group name' }])
  })
  it('should disallow fields that are too short', () => {
    expect(validateGroupName('b'.repeat(3))).toEqual([
      {
        href: '#groupName',
        text: 'Group name must be 4 characters or more',
      },
    ])
  })

  it('should disallow fields that are too long', () => {
    expect(validateGroupName('b'.repeat(241))).toEqual([
      {
        href: '#groupName',
        text: 'Group name must be 240 characters or less',
      },
    ])
  })
  it('should validate specific characters allowed', () => {
    expect(validateGroupName('b@c,d.com')).toEqual(
      expect.arrayContaining([
        { href: '#groupName', text: "Group name can only contain 0-9, a-z and ( ) & , - . '  characters" },
      ])
    )
  })
  it('should pass validation', () => {
    expect(validateGroupName("good's & Groop(),.-")).toEqual([])
  })
})
