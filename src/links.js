const links = {
  notmEndpointUrl: '', // set from env by /api/config call
  getHomeLink: () => `${links.notmEndpointUrl}`,
}

module.exports = links
