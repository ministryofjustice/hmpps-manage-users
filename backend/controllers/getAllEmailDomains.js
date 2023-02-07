const viewEmailDomainsFactory = (getEmailDomainsApi) => {
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('listEmailDomainsErrors', errors)
    res.redirect(req.originalUrl)
  }
  const index = async (req, res) => {
    const emailDomainList = await getEmailDomainsApi(res.locals)

    if (emailDomainList.length === 0) {
      stashStateAndRedirectToIndex(req, res, 'No domains returned')
    }
    res.render('emailDomainListing.njk', {
      domains: emailDomainList,
      errors: req.flash('listEmailDomainsErrors'),
    })
  }

  return { index }
}

module.exports = {
  viewEmailDomainsFactory,
}
