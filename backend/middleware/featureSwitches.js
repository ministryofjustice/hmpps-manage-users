module.exports =
  ({ featureSwitches }) =>
  (req, res, next) => {
    res.locals.featureSwitches = featureSwitches
    next()
  }
