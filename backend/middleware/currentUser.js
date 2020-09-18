module.exports = ({ oauthApi }) => async (req, res, next) => {
  if (!req.xhr) {
    if (!req.session.userDetails) {
      req.session.userDetails = await oauthApi.currentUser(res.locals)
    }

    const { name } = req.session.userDetails

    res.locals.user = {
      ...res.locals.user,
      displayName: name,
    }
  }
  next()
}
