const roleDetailsFactory = (getRoleDetailsApi, maintainUrl) => {
  const index = async (req, res) => {
    const { roleCode } = req.params
    try {
      const roleDetails = await getRoleDetailsApi(res.locals, roleCode)
      res.render('roleDetails.njk', {
        roleDetails,
        maintainUrl,
        errors: req.flash('roleError'),
      })
    } catch (error) {
      if (error.status === 404) {
        const roleError = [{ href: '#roleCode', text: 'Role does not exist' }]
        req.flash('roleError', roleError)
        res.redirect(maintainUrl)
      } else {
        throw error
      }
    }
  }

  return { index }
}

module.exports = {
  roleDetailsFactory,
}
