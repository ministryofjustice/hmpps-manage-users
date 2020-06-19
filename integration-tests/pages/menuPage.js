const page = require('./page')

const menuPage = () => page('Maintain HMPPS Users', {})

export default {
  verifyOnPage: menuPage,
}
