const { ManageUsersEvent, audit } = require('../audit')

const viewEmailDomainsFactory = (getEmailDomainsApi) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('listEmailDomainsErrors', errors)
  }
  const index = async (req, res) => {
    const sendAudit = audit(req.session.userDetails.username)
    await sendAudit(ManageUsersEvent.LIST_EMAIL_DOMAINS_ATTEMPT)

    try {
      const emailDomainList = await getEmailDomainsApi(res.locals)

      if (emailDomainList.length === 0) {
        stashStateAndRedirectToIndex(req, res, ['No email domains returned'])
      }
      res.render('emailDomainListing.njk', {
        domains: emailDomainList,
        errors: req.flash('listEmailDomainsErrors'),
      })
    } catch (error) {
      await sendAudit(ManageUsersEvent.LIST_EMAIL_DOMAINS_FAILURE)
      throw error
    }
  }

  return { index }
}

module.exports = {
  viewEmailDomainsFactory,
}
