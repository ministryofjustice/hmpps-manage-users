const { validateSearch, validateCreate, validateChangeEmail } = require('./authUserValidation')

describe('Auth search validation', () => {
  describe('missing username', () => {
    const missingResponse = [{ href: '#user', text: 'Enter a username or email address' }]
    it('should return error if no user specified', () => {
      expect(validateSearch('')).toEqual(missingResponse)
    })

    it('should return error if blank user specified', () => {
      expect(validateSearch('           ')).toEqual(missingResponse)
    })
  })

  describe('invalid username', () => {
    const invalidResponse = [{ href: '#user', text: 'Username can only include letters, numbers and _' }]

    it('should return error if invalid characters used', () => {
      expect(validateSearch('hello.there')).toEqual(invalidResponse)
    })

    it('should succeed if other characters used in email address', () => {
      expect(validateSearch('hello.bob@joe.com')).toEqual([])
    })

    it('should succeed if numbers and _ used in username', () => {
      expect(validateSearch('1234hello_gen')).toEqual([])
    })

    it('should return error if spaces used in username', () => {
      expect(validateSearch('1234hello gen')).toEqual(invalidResponse)
    })
  })

  it('should success if user specified', () => {
    expect(validateSearch('    someuser  ')).toEqual([])
  })
})

describe('Auth create validation', () => {
  it('should return errors if no fields specified', () => {
    expect(validateCreate({ username: null, email: null, firstName: null, lastName: null, groupCode: null })).toEqual(
      expect.arrayContaining([
        { href: '#username', text: 'Enter a username' },
        { href: '#email', text: 'Enter an email address' },
        { href: '#firstName', text: 'Enter a first name' },
        { href: '#lastName', text: 'Enter a last name' },
      ])
    )
  })
  it('should disallow fields that are too short', () => {
    expect(validateCreate({ username: 'a', email: 'b', firstName: 'c', lastName: 'd', groupCode: null })).toEqual(
      expect.arrayContaining([
        { href: '#username', text: 'Username must be 6 characters or more' },
        { href: '#email', text: 'Enter an email address in the correct format, like first.last@justice.gov.uk' },
        { href: '#firstName', text: 'First name must be 2 characters or more' },
        { href: '#lastName', text: 'Last name must be 2 characters or more' },
      ])
    )
  })
  it('should disallow fields that are too long', () => {
    expect(
      validateCreate({
        username: 'A12345678901234567890123456789012345678901234567890',
        email: 'joe@bloggs.com',
        firstName: 'ccccccccccccccccccccccccccccccccccccccccccccccccccc',
        lastName: 'dddddddddddddddddddddddddddddddddddddddddddddddddddd',
        groupCode: null,
      })
    ).toEqual(
      expect.arrayContaining([
        { href: '#username', text: 'Username must be 30 characters or less' },
        { href: '#firstName', text: 'First name must be 50 characters or less' },
        { href: '#lastName', text: 'Last name must be 50 characters or less' },
      ])
    )
  })
  it('should validate specific characters allowed', () => {
    expect(
      validateCreate({ username: '"', email: 'b@c,d.com', firstName: 'ca', lastName: 'de', groupCode: null })
    ).toEqual(
      expect.arrayContaining([
        { href: '#username', text: 'Username must be 6 characters or more' },
        { href: '#username', text: 'Username can only contain A-Z, 0-9 and _ characters' },
        { href: '#email', text: "Email address can only contain 0-9, a-z, @, ', _, ., - and + characters" },
      ])
    )
  })
  it('should pass validation', () => {
    expect(
      validateCreate({
        username: 'joejoe',
        email: 'joe+bloggs@joe.com',
        firstName: 'joe',
        lastName: 'joe',
        groupCode: null,
      })
    ).toEqual([])
  })
  it('should pass validation with microsoft special quote', () => {
    expect(
      validateCreate({
        username: 'joejoe',
        email: 'joe.b’loggs@joe.com',
        firstName: 'joe',
        lastName: 'joe',
        groupCode: null,
      })
    ).toEqual([])
  })
})

describe('Auth change email validation', () => {
  it('should return errors if no fields specified', () => {
    expect(validateChangeEmail(null)).toEqual([{ href: '#email', text: 'Enter an email address' }])
  })
  it('should disallow fields in wrong format', () => {
    expect(validateChangeEmail('b')).toEqual([
      { href: '#email', text: 'Enter an email address in the correct format, like first.last@justice.gov.uk' },
    ])
  })
  it('should disallow fields that are too long', () => {
    expect(validateChangeEmail('b'.repeat(241))).toEqual(
      expect.arrayContaining([
        { href: '#email', text: 'Enter an email address in the correct format, like first.last@justice.gov.uk' },
        { href: '#email', text: 'Email address must be 240 characters or less' },
      ])
    )
  })
  it('should validate specific characters allowed', () => {
    expect(validateChangeEmail('b@c,d.com')).toEqual(
      expect.arrayContaining([
        { href: '#email', text: "Email address can only contain 0-9, a-z, @, ', _, ., - and + characters" },
      ])
    )
  })
  it('should pass validation', () => {
    expect(validateChangeEmail('joe+bloggs@joe.com')).toEqual([])
  })
})
