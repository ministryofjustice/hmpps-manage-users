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

  const getNotificationBannerMessage = (context, notificationType) =>
    get(context, `/notification/banner/${notificationType}`)

  const createUser = (context, user) => post(context, '/prisonusers', user)
  const contextUserRoles = (context, username) => get(context, `/prisonusers/${username}/roles`)
  const getAllEmailDomains = (context) => {
    return client.get(context, `/email-domains`).then(processPageResponse(context))
  }
  const createEmailDomain = (context, domain) => post(context, '/email-domains', domain)
  const deleteEmailDomain = (context, domainId) => del(context, `/email-domains/${domainId}`)

  const createRole = (context, role) => post(context, '/roles', role)
  const getRoles = (context, { adminTypes }) => get(context, `/roles?adminTypes=${adminTypes}`)
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
  const getRoleDetails = (context, roleCode) => get(context, `/roles/${roleCode}`)
  const changeRoleName = (context, roleCode, roleName) => client.put(context, `/roles/${roleCode}`, roleName)
  const changeRoleDescription = (context, role, roleDescription) =>
    put(context, `/roles/${role}/description`, roleDescription)
  const changeRoleAdminType = (context, role, adminType) => put(context, `/roles/${role}/admintype`, adminType)

  const externalUserAddRoles = (context, { userId, roles }) => post(context, `/externalusers/${userId}/roles`, roles)
  const externalUserRoles = (context, userId) => get(context, `/externalusers/${userId}/roles`)
  const deleteExternalUserRole = (context, { userId, role }) => del(context, `/externalusers/${userId}/roles/${role}`)
  const assignableRoles = (context, { userId }) => get(context, `/externalusers/${userId}/assignable-roles`)
  const currentRoles = (context) => get(context, '/users/me/roles')
  const searchableRoles = (context) => get(context, '/externalusers/me/searchable-roles')

  const createGroup = (context, group) => post(context, '/groups', group)
  const groupDetails = (context, { group }) => get(context, `/groups/${group}`)
  const changeGroupName = (context, group, groupName) => put(context, `/groups/${group}`, groupName)
  const deleteGroup = (context, group) => del(context, `/groups/${group}`)

  const createChildGroup = (context, group) => post(context, '/groups/child', group)
  const childGroupDetails = (context, { group }) => get(context, `/groups/child/${group}`)
  const changeChildGroupName = (context, group, groupName) => put(context, `/groups/child/${group}`, groupName)
  const deleteChildGroup = (context, group) => del(context, `/groups/child/${group}`)
  const assignableGroups = (context) => get(context, '/externalusers/me/assignable-groups')

  const userGroups = (context, { userId }) => get(context, `/externalusers/${userId}/groups?children=false`)
  const removeUserGroup = (context, { userId, group }) => del(context, `/externalusers/${userId}/groups/${group}`)
  const addUserGroup = (context, { userId, group }) => put(context, `/externalusers/${userId}/groups/${group}`)

  const userSearch = (context, { nameFilter, role, group, status }, page, size) => {
    const groups = group ? [group] : null
    const roles = role ? [role] : null
    const query = querystring.stringify({
      name: nameFilter,
      groups,
      roles,
      status,
      page,
      size,
    })
    return client.get(context, `/externalusers/search?${query}`).then(processPageResponse(context))
  }
  const enableExternalUser = (context, { userId }) => put(context, `/externalusers/${userId}/enable`)
  const disableExternalUser = (context, { userId }) => put(context, `/externalusers/${userId}/disable`)
  const deactivateExternalUser = (context, { userId, reason }) =>
    put(context, `/externalusers/${userId}/disable`, { reason })

  return {
    getNotificationBannerMessage,
    contextUserRoles,
    createUser,
    createRole,
    getPagedRoles,
    getAllEmailDomains,
    createEmailDomain,
    deleteEmailDomain,
    getRoles,
    assignableRoles,
    getRoleDetails,
    changeRoleName,
    changeRoleDescription,
    changeRoleAdminType,
    externalUserAddRoles,
    externalUserRoles,
    deleteExternalUserRole,
    createGroup,
    groupDetails,
    changeGroupName,
    deleteGroup,
    createChildGroup,
    childGroupDetails,
    changeChildGroupName,
    deleteChildGroup,
    assignableGroups,
    userGroups,
    addUserGroup,
    removeUserGroup,
    userSearch,
    enableExternalUser,
    disableExternalUser,
    deactivateExternalUser,
    currentRoles,
    searchableRoles,
  }
}

module.exports = { manageUsersApiFactory }
