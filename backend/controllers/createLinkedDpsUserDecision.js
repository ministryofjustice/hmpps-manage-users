const { validateLinkedUserOptionSelection } = require('./linkedAccountValidation')
const cleanUpRedirect = require('../utils/urlUtils').default

const createLinkedDpsUserDecisionFactory = (createLinkedUserUrl) => {
  const stashStateAndRedirectToCreateUser = (req, res) => {
    // res.redirect(cleanUpRedirect(createLinkedUserUrl))
    if (req.originalUrl === '/create-user-options') {
      res.redirect('/create-user')
    } else {
      res.redirect(cleanUpRedirect(req.originalUrl))
    }
  }
  const stashStateAndRedirectToCreateLinkedDpsUser = (req, res, user) => {
    req.flash('user', user)
    res.redirect(cleanUpRedirect(createLinkedUserUrl))
  }

  const stashStateAndRedirectToIndex = (req, res, errors, user) => {
    req.flash('createDpsUserErrors', errors)
    req.flash('user', user)
    res.redirect(cleanUpRedirect(req.originalUrl))
  }
  const userTypes = new Map()
  userTypes.set('DPS_ADM', 'Central Admin')
  userTypes.set('DPS_GEN', 'General')
  userTypes.set('DPS_LSA', 'Local System Administrator (LSA)')

  const index = async (req, res) => {
    const flashUser = req.flash('user')
    const user = flashUser != null && flashUser.length > 0 ? flashUser[0] : ''
    // redirect if no user or type configured
    if (user === '' || user.userType === 'undefined') {
      stashStateAndRedirectToCreateUser(req, res)
    } else {
      const currentUserTypeDesc = userTypes.get(user.userType)
      res.render('createLinkedUserDecision.njk', {
        title: `Create a DPS ${currentUserTypeDesc} User`,
        ...user,
        userType: user.userType,
        errors: req.flash('createDpsUserErrors'),
      })
    }
  }

  const post = async (req, res) => {
    const user = req.body
    const errors = validateLinkedUserOptionSelection(user.userExists)
    // const errors = []
    if (errors.length > 0) {
      stashStateAndRedirectToIndex(req, res, errors, [user])
    } else {
      // eslint-disable-next-line no-useless-catch
      try {
        stashStateAndRedirectToCreateLinkedDpsUser(req, res, [user])
      } catch (err) {
        throw err
      }
    }
  }

  return { index, post }
}

module.exports = {
  createLinkedDpsUserDecisionFactory,
}
