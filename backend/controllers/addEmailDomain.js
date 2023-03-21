const { trimObjValues } = require('../utils/utils')
const { validateCreateDomain } = require('./emailDomainValidation')

const createEmailDomainFactory = (createEmailDomainApi, createEmailDomainUrl, listEmailDomainUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors, domain) => {
    req.flash('createEmailDomainErrors', errors)
    req.flash('domain', domain)
    res.redirect(req.originalUrl)
  }

  const index = async (req, res) => {
    const flashDomain = req.flash('domain')
    const domain = flashDomain != null && flashDomain.length > 0 ? flashDomain[0] : ''
    res.render('createEmailDomain.njk', {
      createEmailDomainUrl,
      listEmailDomainUrl,
      ...domain,
      errors: req.flash('createEmailDomainErrors'),
    })
  }

  const createEmailDomain = async (req, res) => {
    const domain = trimObjValues(req.body)
    const errors = validateCreateDomain(domain)

    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [domain])
    } else {
      try {
        const newDomain = { name: domain.domainName, description: domain.domainDescription }
        await createEmailDomainApi(res.locals, newDomain)
        res.redirect('/email-domains')
      } catch (err) {
        if (err.status === 409 && err.response && err.response.body) {
          const domainError = [{ href: '#domainName', text: err.response.body.userMessage }]
          stashStateAndRedirectToIndex(req, res, domainError, [domain])
        } else {
          throw err
        }
      }
    }
  }
  return { index, createEmailDomain }
}

module.exports = {
  createEmailDomainFactory,
}
