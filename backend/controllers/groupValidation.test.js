const { validateGroupName, validateCreateGroup } = require('./groupValidation')

describe('group name change validation', () => {
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
    expect(validateGroupName('b'.repeat(101))).toEqual([
      {
        href: '#groupName',
        text: 'Group name must be 100 characters or less',
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
  it('should pass group name validation', () => {
    expect(validateGroupName("good's & Groop(),.-")).toEqual([])
  })
})

describe('create child group validation', () => {
  it('should return errors if no groupCode specified', () => {
    expect(validateCreateGroup({ groupCode: '', groupName: 'bob' })).toEqual([
      { href: '#groupCode', text: 'Enter a group code' },
    ])
  })
  it('should return errors if no groupName specified', () => {
    expect(validateCreateGroup({ groupCode: 'GROUP_CODE', groupName: '' })).toEqual([
      { href: '#groupName', text: 'Enter a group name' },
    ])
  })
  it('should disallow group name that are too short', () => {
    expect(validateCreateGroup({ groupCode: 'GROUP_CODE', groupName: 'b'.repeat(3) })).toEqual([
      {
        href: '#groupName',
        text: 'Group name must be 4 characters or more',
      },
    ])
  })

  it('should disallow group name that are too long', () => {
    expect(validateCreateGroup({ groupCode: 'GROUP_CODE', groupName: 'b'.repeat(101) })).toEqual([
      {
        href: '#groupName',
        text: 'Group name must be 100 characters or less',
      },
    ])
  })
  it('should validate specific characters allowed for group name', () => {
    expect(validateCreateGroup({ groupCode: 'GROUP_CODE', groupName: 'b@c,d.com' })).toEqual(
      expect.arrayContaining([
        { href: '#groupName', text: "Group name can only contain 0-9, a-z and ( ) & , - . '  characters" },
      ])
    )
  })

  it('should validate specific characters allowed for group code', () => {
    expect(validateCreateGroup({ groupCode: 'GROUP_CODE@', groupName: 'group name' })).toEqual(
      expect.arrayContaining([{ href: '#groupCode', text: 'Group code can only contain 0-9, A-Z and _ characters' }])
    )
  })

  it('should disallow group code that are too short', () => {
    expect(validateCreateGroup({ groupCode: 'G', groupName: 'group name' })).toEqual([
      {
        href: '#groupCode',
        text: 'Group code must be 2 characters or more',
      },
    ])
  })

  it('should disallow group code that are too long', () => {
    expect(validateCreateGroup({ groupCode: 'G'.repeat(31), groupName: 'group name' })).toEqual([
      {
        href: '#groupCode',
        text: 'Group code must be 30 characters or less',
      },
    ])
  })
})
