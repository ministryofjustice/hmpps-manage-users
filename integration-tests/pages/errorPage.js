const page = require('./page')

const errorPage = () => page('Sorry, there is a problem with the service', {})

export default {
  verifyOnPage: errorPage,
}
