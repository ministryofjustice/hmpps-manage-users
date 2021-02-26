const page = require('./page')

const notFoundPage = () => page('Page not found', {})

export default {
  verifyOnPage: notFoundPage,
}
