const createEmailDomainFactory = (createEmailDomainApi, createEmailDomainUrl, listEmailDomainUrl) => {
  // TODO: All validation logic
  const stashStateAndRedirectToIndex = (req, res, errors) => {
    req.flash('createEmailDomainErrors', errors)
    res.redirect(req.originalUrl)
  }
  const index = async (req, res) => {
    res.render('createEmailDomain.njk', {
      createEmailDomainUrl,
      listEmailDomainUrl,
      errors: req.flash('createEmailDomainErrors'),
    })
  }

  const post = async (req, res) => {
    const { domainName, domainDescription } = req.body
    const newDomain = { name: domainName, description: domainDescription }

    await createEmailDomainApi(res.locals, newDomain)
    res.redirect('/email-domains')
  }
  return { index, post }
}

module.exports = {
  createEmailDomainFactory,
}
