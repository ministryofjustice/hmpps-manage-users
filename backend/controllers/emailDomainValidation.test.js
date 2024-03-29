const { validateCreateDomain } = require('./emailDomainValidation')

describe('create email domain validation scenarios', () => {
  it('should return error if no email domain name is specified', () => {
    const newDomain = { domainName: '', domainDescription: 'Domain Description 1' }
    expect(validateCreateDomain(newDomain)).toEqual(
      expect.arrayContaining([{ href: '#domainName', text: 'Enter a domain name' }]),
    )
  })

  it('should disallow email domain name with length less than 6', () => {
    const newDomain = { domainName: 'DOM1', domainDescription: 'DomainDescription1' }
    expect(validateCreateDomain(newDomain)).toEqual(
      expect.arrayContaining([{ href: '#domainName', text: 'Domain name must be 6 characters or more' }]),
    )
  })

  it('should disallow email domain name of length more than 100', () => {
    const newDomain = { domainName: 'D'.repeat(101), domainDescription: 'Domain Description 1' }
    expect(validateCreateDomain(newDomain)).toEqual(
      expect.arrayContaining([{ href: '#domainName', text: 'Domain name must be 100 characters or less' }]),
    )
  })

  it('should return an error if the domain description is not specified', () => {
    const newDomain = { domainName: 'Domain1', domainDescription: '' }
    expect(validateCreateDomain(newDomain)).toEqual([
      { href: '#domainDescription', text: 'Enter a domain description' },
    ])
  })

  it('should disallow email domain description of length less than 2', () => {
    const newDomain = { domainName: 'Domain1', domainDescription: 'D' }
    expect(validateCreateDomain(newDomain)).toEqual(
      expect.arrayContaining([{ href: '#domainDescription', text: 'Domain description must be 2 characters or more' }]),
    )
  })

  it('should disallow email domain description of length more than 200', () => {
    const newDomain = { domainName: 'Domain1', domainDescription: 'D'.repeat(201) }
    expect(validateCreateDomain(newDomain)).toEqual(
      expect.arrayContaining([
        { href: '#domainDescription', text: 'Domain description must be 200 characters or less' },
      ]),
    )
  })
})
