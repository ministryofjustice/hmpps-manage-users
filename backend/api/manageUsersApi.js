const querystring = require('querystring')
const contextProperties = require('../contextProperties')

const processPageResponse = (context) => (response) => {
  if (response.body.pageable) {
    contextProperties.setPageable(context, response.body)
    return response.body.content
  }
  return response.body
}

const manageUsersApiFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)
  const post = (context, path, body) => client.post(context, path, body).then((response) => response.body)
  const put = (context, path, body) => client.put(context, path, body).then((response) => response.body)

  const createRole = (context, role) => post(context, '/roles', role)
  const getPagedRoles = (context, page, size, roleName, roleCode, adminType) => {
    const adminTypes = adminType === 'ALL' ? '' : adminType
    const query = querystring.stringify({
      page,
      size,
      roleName,
      roleCode,
      adminTypes,
    })
    return client.get(context, `/roles/paged?${query}`).then(processPageResponse(context))
  }
  const getRoles = (context, { adminTypes }) => get(context, `/roles?adminTypes=${adminTypes}`)

  const getRoleDetails = (context, roleCode) => get(context, `/roles/${roleCode}`)

  const changeRoleName = (context, roleCode, roleName) => client.put(context, `/roles/${roleCode}`, roleName)
  const changeRoleDescription = (context, role, roleDescription) =>
    put(context, `/roles/${role}/description`, roleDescription)
  const changeRoleAdminType = (context, role, adminType) => put(context, `/roles/${role}/admintype`, adminType)

  return {
    createRole,
    getPagedRoles,
    getRoles,
    getRoleDetails,
    changeRoleName,
    changeRoleDescription,
    changeRoleAdminType,
  }
}

module.exports = { manageUsersApiFactory }
