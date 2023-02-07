const deleteEmailDomainFactory = (deleteEmailDomainApi, listEmailDomainsUrl) => {
  // TODO:Error handling
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

  const post = async (req, res) => {
    const { domainId } = req.body

    try {
      await deleteEmailDomainApi(res.locals, domainId)
      res.redirect('/email-domains')
    } catch (error) {
      if (error.status === 400) {
        res.redirect(req.originalUrl)
      } else {
        throw error
      }
    }
  }

  return { index, post }
}

module.exports = {
  deleteEmailDomainFactory,
}
