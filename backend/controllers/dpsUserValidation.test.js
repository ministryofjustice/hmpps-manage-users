const { validateDpsUserCreate } = require('./dpsUserValidation')

describe('DPS create validation', () => {
  it('should return errors if no fields specified', () => {
    expect(validateDpsUserCreate(null, null, null, null, null, true, 'Select a default caseload')).toEqual(
      expect.arrayContaining([
        { href: '#email', text: 'Enter an email address' },
        { href: '#username', text: 'Enter a username' },
        { href: '#firstName', text: 'Enter a first name' },
        { href: '#lastName', text: 'Enter a last name' },
        { href: '#defaultCaseloadId', text: 'Select a default caseload' },
      ]),
    )
  })
  it('should disallow fields that are too short', () => {
    expect(validateDpsUserCreate('1', 'a@a.com', 'b', 'c', 'default', true, 'Select a default caseload')).toEqual(
      expect.arrayContaining([
        { href: '#username', text: 'Username must be 2 characters or more' },
        { href: '#firstName', text: 'First name must be 2 characters or more' },
        { href: '#lastName', text: 'Last name must be 2 characters or more' },
      ]),
    )
  })
  it('should disallow fields that are too long', () => {
    expect(
      validateDpsUserCreate(
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'joe@bloggs.com',
        'cccccccccccccccccccccccccccccccccccc',
        'dddddddddddddddddddddddddddddddddddd',
        'default',
        true,
        'Select a default caseload',
      ),
    ).toEqual(
      expect.arrayContaining([
        { href: '#username', text: 'Username must be 30 characters or less' },
        { href: '#firstName', text: 'First name must be 35 characters or less' },
        { href: '#lastName', text: 'Last name must be 35 characters or less' },
      ]),
    )
  })
  it('should validate specific characters allowed', () => {
    expect(validateDpsUserCreate('un', 'b@c,d.com', 'ca', 'de', 'default', true, 'Select a default caseload')).toEqual(
      expect.arrayContaining([
        { href: '#email', text: "Email address can only contain 0-9, a-z, @, ', _, ., - and + characters" },
      ]),
    )
  })
  it('should validate specific characters allowed for First name field with alphabetical strings', () => {
    expect(validateDpsUserCreate('un', 'b@d.com', 'ca4', 'de3', 'default', true, 'Select a default caseload')).toEqual(
      expect.arrayContaining([
        {
          href: '#firstName',
          text: 'First name must be consist of letters, an forward apostrophe, standard apostrophe & hyphen only',
        },
      ]),
    )
  })

  it('should validate specific characters allowed for Last name field with alphabetical strings', () => {
    expect(validateDpsUserCreate('un', 'b@d.com', 'ca', 'de3', 'default', true, 'Select a default caseload')).toEqual(
      expect.arrayContaining([
        {
          href: '#lastName',
          text: 'Last name must be consist of letters, an forward apostrophe, standard apostrophe & hyphen only',
        },
      ]),
    )
  })
  it('should pass validation', () => {
    expect(
      validateDpsUserCreate(
        'JBLOGGS_ADM',
        'joe+bloggs@joe.com',
        'joe',
        "B'loggs",
        'MDI',
        true,
        'Select a default caseload',
      ),
    ).toEqual([])
  })

  it('should pass first and last name validation with ', () => {
    expect(
      validateDpsUserCreate(
        'JBLOGGS_ADM',
        'joe+bloggs@joe.com',
        'O’Shea',
        "B'loggs-Paul",
        'MDI',
        true,
        'Select a default caseload',
      ),
    ).toEqual([])
  })

  it('should pass first and last name validation with', () => {
    expect(
      validateDpsUserCreate(
        'JBLOGGS_ADM',
        'joe+bloggs@joe.com',
        'Sarah-Louise',
        "B'loggs",
        'MDI',
        true,
        'Select a default caseload',
      ),
    ).toEqual([])
  })
  it('should pass validation with microsoft special quote', () => {
    expect(
      validateDpsUserCreate(
        'JBLOGGS_ADM',
        'joe.b’loggs@joe.com',
        'joe',
        'joe',
        'MDI',
        true,
        'Select a default caseload',
      ),
    ).toEqual([])
  })
})
