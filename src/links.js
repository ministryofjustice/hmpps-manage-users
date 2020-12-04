const links = {
  authUiUrl: '', // set from env by /api/config call
  getHomeLink: () => `${links.authUiUrl}`,
}

module.exports = links
