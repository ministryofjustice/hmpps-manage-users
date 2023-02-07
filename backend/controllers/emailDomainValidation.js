const validateDomainNameFormat = (domainName) => {
  const errors = []
  if (!domainName.match(/^[0-9A-Za-z- ,.()'&]*$/)) {
    errors.push({
      href: '#domainName',
      text: "Domain name can only contain 0-9, a-z and ( ) & , - . '  characters",
    })
  }
  if (domainName.length < 6) {
    errors.push({ href: '#domainName', text: 'Domain name must be 6 characters or more' })
  }
  if (domainName.length > 100) {
    errors.push({ href: '#domainName', text: 'Domain name must be 100 characters or less' })
  }
  return errors
}

const validateDomainDescriptionFormat = (domainDescription) => {
  const errors = []
  if (!domainDescription.match(/^[0-9A-Z_]*$/)) {
    errors.push({
      href: '#domainDescription',
      text: 'Domain Description can only contain 0-9, A-Z and _ characters',
    })
  }

  if (domainDescription.length < 2) {
    errors.push({ href: '#domainDescription', text: 'Domain description must be 2 characters or more' })
  }
  if (domainDescription.length > 200) {
    errors.push({ href: '#domainDescription', text: 'Domain description must be 200 characters or less' })
  }

  return errors
}
const validateDomainName = (domainName) => {
  if (!domainName) return [{ href: '#domainName', text: 'Enter a domain name' }]

  return validateDomainNameFormat(domainName)
}

const validateCreateDomain = ({ domainName, domainDescription }) => {
  const errors = []

  if (!domainName) {
    errors.push({ href: '#domainName', text: 'Enter a domain name' })
  }
  if (!domainDescription) {
    errors.push({ href: '#domainDescription', text: 'Enter a domain description' })
  }

  if (errors.length) return errors

  errors.push(...validateDomainNameFormat(domainName))
  errors.push(...validateDomainDescriptionFormat(domainDescription))

  return errors
}

module.exports = { validateDomainName, validateCreateDomain }
