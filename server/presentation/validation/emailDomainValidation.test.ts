import { validateDomainDescription, validateDomainName } from './emailDomainValidation'
import { FormError } from '../../interfaces/formError'

describe('emailDomainValidation', () => {
  describe('validate domain name', () => {
    it('should return error if no email domain name is specified', () => {
      const result = validateDomainName('')
      expect(result).toEqual<FormError[]>([{ href: '#name', text: 'Enter a domain name' }])
    })

    it('should disallow email domain name with length less than 6', () => {
      const result = validateDomainName('DOM1')
      expect(result).toEqual<FormError[]>([{ href: '#name', text: 'Domain name must be 6 characters or more' }])
    })

    it('should disallow email domain name of length more than 100', () => {
      const result = validateDomainName('D'.repeat(101))
      expect(result).toEqual<FormError[]>([{ href: '#name', text: 'Domain name must be 100 characters or less' }])
    })
  })

  describe('validate domain description', () => {
    it('should return an error if the domain description is not specified', () => {
      const result = validateDomainDescription('')
      expect(result).toEqual<FormError[]>([{ href: '#description', text: 'Enter a domain description' }])
    })

    it('should disallow email domain description of length less than 2', () => {
      const result = validateDomainDescription('D')
      expect(result).toEqual<FormError[]>([
        { href: '#description', text: 'Domain description must be 2 characters or more' },
      ])
    })

    it('should disallow email domain description of length more than 200', () => {
      const result = validateDomainDescription('D'.repeat(201))
      expect(result).toEqual<FormError[]>([
        { href: '#description', text: 'Domain description must be 200 characters or less' },
      ])
    })
  })
})
