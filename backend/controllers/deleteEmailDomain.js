const { auditService } = require('@ministryofjustice/hmpps-audit-client')

const deleteEmailDomainFactory = (deleteEmailDomainApi, listEmailDomainsUrl) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('deleteEmailDomainErrors', errors)
    res.redirect(req.originalUrl)
  }
  const index = async (req, res) => {
    const { id, name } = req.query

    res.render('deleteEmailDomain.njk', {
      domainId: id,
      domainName: name,
      listEmailDomainsUrl,
      errors: req.flash('deleteEmailDomainErrors'),
    })
  }

  const deleteEmailDomain = async (req, res) => {
    const { domainId } = req.body

    try {
      await deleteEmailDomainApi(res.locals, domainId)
      const { username } = req.session.userDetails
      await auditService.sendAuditMessage({
        action: 'DELETE_EMAIL_DOMAIN',
        who: username,
        details: JSON.stringify({ domainId }),
      })
      res.redirect('/email-domains')
    } catch (error) {
      if (error.status === 400) {
        res.redirect(req.originalUrl)
      } else if (error.status === 401 && error.response && error.response.body) {
        const domainUnauthorizedError = [
          {
            href: '#domainName',
            text: 'Unauthorized to use the delete email domain functionality',
          },
        ]
        stashStateAndRedirectToIndex(req, res, domainUnauthorizedError)
      } else if (error.status === 404 && error.response && error.response.body) {
        const domainNotFoundError = [{ href: '#domainName', text: 'Email domain not found' }]
        stashStateAndRedirectToIndex(req, res, domainNotFoundError)
      } else {
        throw error
      }
    }
  }

  return { index, deleteEmailDomain }
}

module.exports = {
  deleteEmailDomainFactory,
}
