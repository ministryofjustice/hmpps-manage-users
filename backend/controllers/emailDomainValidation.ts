const validateDomainNameFormat = (domainName: string) => {
  const errors = []
  if (domainName.length < 6) {
    errors.push({ href: '#domainName', text: 'Domain name must be 6 characters or more' })
  }
  if (domainName.length > 100) {
    errors.push({ href: '#domainName', text: 'Domain name must be 100 characters or less' })
  }
  return errors
}

const validateDomainDescriptionFormat = (domainDescription: string) => {
  const errors = []
  if (domainDescription.length < 2) {
    errors.push({ href: '#domainDescription', text: 'Domain description must be 2 characters or more' })
  }
  if (domainDescription.length > 200) {
    errors.push({ href: '#domainDescription', text: 'Domain description must be 200 characters or less' })
  }
  return errors
}

const validateCreateDomain = (domain: { domainName: string; domainDescription: string }) => {
  const errors = []
  if (!domain.domainName) {
    errors.push({ href: '#domainName', text: 'Enter a domain name' })
  }
  if (!domain.domainDescription) {
    errors.push({ href: '#domainDescription', text: 'Enter a domain description' })
  }
  if (errors.length) return errors

  errors.push(...validateDomainNameFormat(domain.domainName))
  errors.push(...validateDomainDescriptionFormat(domain.domainDescription))

  return errors
}

module.exports = { validateCreateDomain }
