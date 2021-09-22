const manageUsersApiFactory = (client) => {
  const get = (context, path) => client.get(context, path).then((response) => response.body)

  const getRoleDetails = (context, roleCode) => get(context, `/roles/${roleCode}`)

  return {
    getRoleDetails,
  }
}

module.exports = { manageUsersApiFactory }
