function searchApiFacade(nomisUsersAndRolesApi, manageUsersApi) {
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
    showOnlyLSAs,
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
      showOnlyLSAs,
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
    showOnlyLSAs,
  }) => {
    const result = await nomisUsersAndRolesApi.downloadUserSearch(context, {
      nameFilter,
      accessRoles,
      caseload,
      activeCaseload,
      status,
      inclusiveRoles,
      showOnlyLSAs,
    })
    if (result.length === 0)
      return {
        searchResults: result,
      }
    return {
      searchResults: result,
    }
  }

  const downloadNomisLsaDetails = async ({
    locals: context,
    user: nameFilter,
    accessRoles,
    status,
    caseload,
    activeCaseload,
    inclusiveRoles,
    showOnlyLSAs,
  }) => {
    const result = await nomisUsersAndRolesApi.downloadLsaSearch(context, {
      nameFilter,
      accessRoles,
      caseload,
      activeCaseload,
      status,
      inclusiveRoles,
      showOnlyLSAs,
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
    return (await manageUsersApi.getCaseloads(context))
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
    downloadNomisLsaDetails,
  }
}

module.exports = (nomisUsersAndRolesApi, manageUsersApi) => searchApiFacade(nomisUsersAndRolesApi, manageUsersApi)
