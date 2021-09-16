const {
  validateRoleName,
  validateRoleDescription,
  validateCreateRole,
  validateRoleAdminType,
} = require('./roleValidation')

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

describe('create role validation', () => {
  it('should pass create role validation', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE1',
        roleName: 'Role Name',
        roleDescription: 'Description',
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([])
  })

  it('should pass create role validation with multi line role description', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE1',
        roleName: 'Role Name',
        roleDescription: 'Description\r\non\r\nmultiple lines',
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([])
  })

  it('should return errors if no roleCode specified', () => {
    expect(
      validateCreateRole({ roleCode: '', roleName: 'bob', roleDescription: null, adminType: ['EXT_ADM'] }),
    ).toEqual([{ href: '#roleCode', text: 'Enter a role code' }])
  })
  it('should return errors if no roleName specified', () => {
    expect(
      validateCreateRole({ roleCode: 'ROLE_CODE', roleName: '', roleDescription: null, adminType: ['EXT_ADM'] }),
    ).toEqual([{ href: '#roleName', text: 'Enter a role name' }])
  })
  it('should disallow role name that are too short', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'b'.repeat(3),
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([
      {
        href: '#roleName',
        text: 'Role name must be 4 characters or more',
      },
    ])
  })

  it('should disallow role name that are too long', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'b'.repeat(101),
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([
      {
        href: '#roleName',
        text: 'Role name must be 100 characters or less',
      },
    ])
  })
  it('should validate specific characters allowed for role name', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'b@c,d.com',
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual(
      expect.arrayContaining([
        { href: '#roleName', text: "Role name can only contain 0-9, a-z and ( ) & , - . '  characters" },
      ]),
    )
  })

  it('should disallow role description that are too long', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'role name',
        roleDescription: 'b'.repeat(1025),
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([
      {
        href: '#roleDescription',
        text: 'Role description must be 1024 characters or less',
      },
    ])
  })

  it('should validate specific characters allowed for role description', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'role name',
        roleDescription: '@ or $',
        adminType: ['EXT_ADM'],
      }),
    ).toEqual(
      expect.arrayContaining([
        {
          href: '#roleDescription',
          text: "Role description can only contain 0-9, a-z, newline and ( ) & , - . '  characters",
        },
      ]),
    )
  })

  it('should validate specific characters allowed for role code', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE@',
        roleName: 'role name',
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual(
      expect.arrayContaining([{ href: '#roleCode', text: 'Role code can only contain 0-9, A-Z and _ characters' }]),
    )
  })

  it('should disallow role code that are too short', () => {
    expect(
      validateCreateRole({ roleCode: 'R', roleName: 'role name', roleDescription: null, adminType: ['EXT_ADM'] }),
    ).toEqual([
      {
        href: '#roleCode',
        text: 'Role code must be 2 characters or more',
      },
    ])
  })

  it('should disallow role code that are too long', () => {
    expect(
      validateCreateRole({
        roleCode: 'R'.repeat(31),
        roleName: 'role name',
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([
      {
        href: '#roleCode',
        text: 'Role code must be 30 characters or less',
      },
    ])
  })
})

describe('create role validation', () => {
  it('should return errors if no roleCode specified', () => {
    expect(
      validateCreateRole({ roleCode: '', roleName: 'bob', roleDescription: null, adminType: ['EXT_ADM'] }),
    ).toEqual([{ href: '#roleCode', text: 'Enter a role code' }])
  })
  it('should return errors if no roleName specified', () => {
    expect(
      validateCreateRole({ roleCode: 'ROLE_CODE', roleName: '', roleDescription: null, adminType: ['EXT_ADM'] }),
    ).toEqual([{ href: '#roleName', text: 'Enter a role name' }])
  })
  it('should disallow role name that are too short', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'b'.repeat(3),
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([
      {
        href: '#roleName',
        text: 'Role name must be 4 characters or more',
      },
    ])
  })

  it('should disallow role name that are too long', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'b'.repeat(101),
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([
      {
        href: '#roleName',
        text: 'Role name must be 100 characters or less',
      },
    ])
  })
  it('should validate specific characters allowed for role name', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'b@c,d.com',
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual(
      expect.arrayContaining([
        { href: '#roleName', text: "Role name can only contain 0-9, a-z and ( ) & , - . '  characters" },
      ]),
    )
  })

  it('should disallow role description that are too long', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'role name',
        roleDescription: 'b'.repeat(1025),
        adminType: 'EXT_ADM',
      }),
    ).toEqual([
      {
        href: '#roleDescription',
        text: 'Role description must be 1024 characters or less',
      },
    ])
  })
  it('should validate specific characters allowed for role description', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE',
        roleName: 'role name',
        roleDescription: '@ or $',
        adminType: 'EXT_ADM',
      }),
    ).toEqual(
      expect.arrayContaining([
        {
          href: '#roleDescription',
          text: "Role description can only contain 0-9, a-z, newline and ( ) & , - . '  characters",
        },
      ]),
    )
  })

  it('should validate specific characters allowed for role code', () => {
    expect(
      validateCreateRole({
        roleCode: 'ROLE_CODE@',
        roleName: 'role name',
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual(
      expect.arrayContaining([{ href: '#roleCode', text: 'Role code can only contain 0-9, A-Z and _ characters' }]),
    )
  })

  it('should disallow role code that are too short', () => {
    expect(
      validateCreateRole({ roleCode: 'R', roleName: 'role name', roleDescription: null, adminType: ['EXT_ADM'] }),
    ).toEqual([
      {
        href: '#roleCode',
        text: 'Role code must be 2 characters or more',
      },
    ])
  })

  it('should disallow role code that are too long', () => {
    expect(
      validateCreateRole({
        roleCode: 'R'.repeat(31),
        roleName: 'role name',
        roleDescription: null,
        adminType: ['EXT_ADM'],
      }),
    ).toEqual([
      {
        href: '#roleCode',
        text: 'Role code must be 30 characters or less',
      },
    ])
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
        {
          href: '#roleDescription',
          text: "Role description can only contain 0-9, a-z, newline and ( ) & , - . '  characters",
        },
      ]),
    )
  })

  it('should pass role description validation', () => {
    expect(validateRoleDescription("good's & Role(),.-lineonelinetwo")).toEqual([])
  })
})

describe('role admin type change validation', () => {
  it('should not allow null role admin type', () => {
    expect(validateRoleAdminType(null)).toEqual([{ href: '#adminType', text: 'Select an admin type' }])
  })
  it('should not allow empty role admin type', () => {
    expect(validateRoleAdminType([])).toEqual([{ href: '#adminType', text: 'Select an admin type' }])
  })
  it('should pass role admin type validation with one type', () => {
    expect(validateRoleAdminType(['EXT_ADM'])).toEqual([])
  })
  it('should pass role admin type validation with multiple admin types', () => {
    expect(validateRoleAdminType(['EXT_ADM', 'DPS_ADM'])).toEqual([])
  })
})
