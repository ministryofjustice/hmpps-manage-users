function searchApiFacade(oauthApi, nomisUsersAndRolesApi, manageUsersApi) {
  const findUsersApi = async ({
    locals: context,
    user: nameFilter,
    accessRoles,
    status,
    caseload,
    activeCaseload,
    size,
    page,
    inclusiveRoles,
  }) => {
    const { content, totalElements, number } = await nomisUsersAndRolesApi.userSearch(context, {
      nameFilter,
      accessRoles,
      caseload,
      activeCaseload,
      status,
      size,
      page,
      inclusiveRoles,
    })

    if (content.length === 0)
      return {
        searchResults: content,
        totalElements,
        number,
      }
    return {
      searchResults: content,
      totalElements,
      number,
    }
  }

  const downloadNomisUserDetails = async ({
    locals: context,
    user: nameFilter,
    accessRoles,
    status,
    caseload,
    activeCaseload,
    inclusiveRoles,
  }) => {
    const result = await nomisUsersAndRolesApi.downloadUserSearch(context, {
      nameFilter,
      accessRoles,
      caseload,
      activeCaseload,
      status,
      inclusiveRoles,
    })
    if (result.length === 0)
      return {
        searchResults: result,
      }
    return {
      searchResults: result,
    }
  }

  const searchableRoles = async (context) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    return manageUsersApi.getRoles(context, { adminTypes: hasAdminRole ? 'DPS_ADM' : 'DPS_LSA' })
  }

  const caseloads = async (context) => {
    const hasAdminRole = Boolean(context?.user?.maintainAccessAdmin)
    if (!hasAdminRole) return []
    return (await nomisUsersAndRolesApi.getCaseloads(context))
      .map((caseload) => ({
        text: caseload.name,
        value: caseload.id,
      }))
      .sort((a, b) => a.text?.localeCompare(b.text))
  }

  return {
    searchableRoles,
    caseloads,
    findUsersApi,
    downloadNomisUserDetails,
  }
}

module.exports = (oauthApi, nomisUsersAndRolesApi, manageUsersApi) =>
  searchApiFacade(oauthApi, nomisUsersAndRolesApi, manageUsersApi)
