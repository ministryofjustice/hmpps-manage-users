const querystring = require('querystring')
const contextProperties = require('../contextProperties')

const prisonApiFactory = (client) => {
  const processResponse = (context) => (response) => {
    contextProperties.setResponsePagination(context, response.headers)
    return response.body
  }

  const get = (context, url, resultsLimit) => client.get(context, url, resultsLimit).then(processResponse(context))
  const userSearch = (context, { nameFilter, roleFilter, status }) =>
    get(
      context,
      `/api/users/local-administrator/available?${querystring.stringify({
        nameFilter,
        accessRole: roleFilter,
        status,
      })}`,
    )
  const userSearchAdmin = (context, { nameFilter, roleFilter, status, caseload, activeCaseload }) =>
    get(
      context,
      `/api/users?${querystring.stringify({ nameFilter, accessRole: roleFilter, status, caseload, activeCaseload })}`,
    )

  const getPrisons = (context) =>
    get(context, '/api/agencies/type/INST?activeOnly=true&withAddresses=false&skipFormatLocation=false')

  return {
    userSearch,
    userSearchAdmin,
    getPrisons,
  }
}

module.exports = { prisonApiFactory }
