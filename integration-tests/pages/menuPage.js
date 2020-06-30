const page = require('./page')

const menuPage = () => page('Manage user accounts', {})

export default {
  verifyOnPage: menuPage,
}
