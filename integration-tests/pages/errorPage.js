const page = require('./page')

const errorPage = () => page('Page not found', {})

export default {
  verifyOnPage: errorPage,
}
