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
  const del = (context, path) => client.del(context, path).then((response) => response.body)

  const createUser = (context, user) => post(context, '/users', user)
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

  const getNotificationBannerMessage = (context, notificationType) =>
    get(context, `/notification/banner/${notificationType}`)

  const contextUserRoles = (context, username) => get(context, `/users/${username}/roles`)

  const createGroup = (context, group) => post(context, '/groups', group)
  const groupDetails = (context, { group }) => get(context, `/groups/${group}`)
  const createChildGroup = (context, group) => post(context, '/groups/child', group)
  const childGroupDetails = (context, { group }) => get(context, `/groups/child/${group}`)

  const changeGroupName = (context, group, groupName) => put(context, `/groups/${group}`, groupName)
  const changeChildGroupName = (context, group, groupName) => put(context, `/groups/child/${group}`, groupName)
  const deleteChildGroup = (context, group) => del(context, `/groups/child/${group}`)
  const deleteGroup = (context, group) => del(context, `/groups/${group}`)

  return {
    createUser,
    createRole,
    contextUserRoles,
    getPagedRoles,
    getRoles,
    getRoleDetails,
    changeRoleName,
    changeRoleDescription,
    changeRoleAdminType,
    getNotificationBannerMessage,
    createGroup,
    groupDetails,
    createChildGroup,
    childGroupDetails,
    changeGroupName,
    changeChildGroupName,
    deleteChildGroup,
    deleteGroup,
  }
}

module.exports = { manageUsersApiFactory }
