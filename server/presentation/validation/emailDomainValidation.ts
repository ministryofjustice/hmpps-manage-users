import { FormError } from '../../interfaces/formError'

export const validateDomainName = (domainName: string): FormError[] => {
  const errors: FormError[] = []
  if (!domainName) {
    errors.push({ href: '#name', text: 'Enter a domain name' })
  } else {
    if (domainName.length < 6) {
      errors.push({ href: '#name', text: 'Domain name must be 6 characters or more' })
    }
    if (domainName.length > 100) {
      errors.push({ href: '#name', text: 'Domain name must be 100 characters or less' })
    }
  }
  return errors
}

export const validateDomainDescription = (domainDescription: string): FormError[] => {
  const errors: FormError[] = []
  if (!domainDescription) {
    errors.push({ href: '#description', text: 'Enter a domain description' })
  } else {
    if (domainDescription.length < 2) {
      errors.push({ href: '#description', text: 'Domain description must be 2 characters or more' })
    }
    if (domainDescription.length > 200) {
      errors.push({ href: '#description', text: 'Domain description must be 200 characters or less' })
    }
  }
  return errors
}
