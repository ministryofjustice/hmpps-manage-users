import { path } from 'static-path'

const createUser = path('/create-user')
const createUserOptions = path('/create-user-options')
const createDpsUser = path('/create-dps-user')
const createLinkedDpsUser = path('/create-linked-dps-user')
const searchDpsUser = path('/search-with-filter-dps-users')
const searchDpsUserDownload = searchDpsUser.path('user-download')
const searchDpsUserLsaDownload = searchDpsUser.path('lsa-download')
const manageDpsUser = path('/manage-dps-users/:userId')
const details = path('/details')
const selectRoles = path('/select-roles')
const role = path('/:role')
const roleRoot = path('/roles').path(role.pattern)
const remove = path('/remove')
const requestRemoval = path('/request-removal')
const selectCaseloads = path('/select-caseloads')
const removeCaseload = path('/caseloads/:caseload/remove')
const changeEmail = path('/change-email')
const changeEmailSuccess = path('/change-email-success')
const activate = path('/activate')
const deactivate = path('/deactivate')
const emailDomains = path('/email-domains')
const createEmailDomain = path('/create-email-domain')
const deleteEmailDomain = path('/delete-email-domain')
const manageGroups = path('/manage-groups')
const createGroup = path('/create-group')
const group = path('/:group')
const changeGroupName = path('/change-group-name')
const childGroup = path('/:childGroup')
const changeChildGroupName = path('/change-child-group-name')
const createChildGroup = path('/create-child-group')
const deletePath = path('/delete')
const deleteChildGroup = path('/delete-child-group')
const manageRoles = path('/manage-roles')
const createRole = path('/create-role')
const changeRoleName = path('/change-role-name')
const changeRoleDescription = path('/change-role-description')
const changeRoleAdminType = path('/change-role-admin-type')
const crsGroupSelection = path('/crs-group-selection')
const userAllowList = path('/user-allow-list')
const addUserToAllowList = userAllowList.path('/add')
const userAllowListView = userAllowList.path('/:username/view')
const userAllowListEdit = userAllowList.path('/:username/edit')
const download = path('/download')
const createExternalUser = path('/create-external-user')
const searchExternalUser = path('/search-external-users')
const manageExternalUser = path('/manage-external-users/:userId')
const selectGroup = path('/select-group')
const removeGroup = path('/groups').path(group.pattern).path(remove.pattern)
const reason = path('/reason')
const bulkUserRolesCreate = path('/change-roles-in-bulk')
const jiraReference = path('/jira-reference')
const uploadUsers = path('/upload-users')
const summary = path('/summary')
const submit = path('/submit')
const bulkUserRolesView = path('/view-bulk-role-changes')
const requests = path('/requests')
const bulkUserRolesRequest = requests.path('/:id')

const roleRootAbsolute = manageDpsUser.path(roleRoot.pattern)
const paths = {
  dpsUser: {
    createUser,
    createUserOptions,
    createDpsUser,
    createLinkedDpsUser,
    search: searchDpsUser,
    download: searchDpsUserDownload,
    downloadLsa: searchDpsUserLsaDownload,
    manage: {
      root: manageDpsUser,
      details: manageDpsUser.path(details.pattern),
      selectRoles: manageDpsUser.path(selectRoles.pattern),
      roles: {
        remove: roleRootAbsolute.path(remove.pattern),
        requestRemoval: roleRootAbsolute.path(requestRemoval.pattern),
      },
      selectCaseloads: manageDpsUser.path(selectCaseloads.pattern),
      removeCaseload: manageDpsUser.path(removeCaseload.pattern),
      changeEmail: manageDpsUser.path(changeEmail.pattern),
      changeEmailSuccess: manageDpsUser.path(changeEmailSuccess.pattern),
      activate: manageDpsUser.path(activate.pattern),
      deactivate: manageDpsUser.path(deactivate.pattern),
    },
  },
  emailDomains: {
    list: emailDomains,
    create: createEmailDomain,
    delete: deleteEmailDomain,
    deleteWithId: deleteEmailDomain.path('/:id'),
  },
  groups: {
    create: manageGroups.path(createGroup.pattern),
    list: manageGroups,
    details: manageGroups.path(group.pattern),
    changeGroupName: manageGroups.path(group.pattern).path(changeGroupName.pattern),
    delete: manageGroups.path(group.pattern).path(deletePath.pattern),
    createChildGroup: manageGroups.path(group.pattern).path(createChildGroup.pattern),
    changeChildGroupName: manageGroups.path(group.pattern).path(changeChildGroupName.pattern).path(childGroup.pattern),
    deleteChildGroup: manageGroups.path(group.pattern).path(deleteChildGroup.pattern).path(childGroup.pattern),
  },
  roles: {
    list: manageRoles,
    create: manageRoles.path(createRole.pattern),
    details: manageRoles.path(role.pattern),
    changeRoleName: manageRoles.path(role.pattern).path(changeRoleName.pattern),
    changeRoleDescription: manageRoles.path(role.pattern).path(changeRoleDescription.pattern),
    changeRoleAdminType: manageRoles.path(role.pattern).path(changeRoleAdminType.pattern),
  },
  crsGroups: {
    select: crsGroupSelection,
    download: crsGroupSelection.path(download.pattern),
  },
  userAllowList: {
    search: userAllowList,
    addUser: addUserToAllowList,
    download: userAllowList.path(download.pattern),
    manage: {
      view: userAllowListView,
      edit: userAllowListEdit,
    },
  },
  externalUser: {
    create: createExternalUser,
    search: searchExternalUser,
    download: searchExternalUser.path(download.pattern),
    manage: {
      root: manageExternalUser,
      details: manageExternalUser.path(details.pattern),
      selectRoles: manageExternalUser.path(selectRoles.pattern),
      roles: {
        remove: manageExternalUser.path(roleRoot.pattern).path(remove.pattern),
      },
      selectGroup: manageExternalUser.path(selectGroup.pattern),
      groups: {
        remove: manageExternalUser.path(removeGroup.pattern),
      },
      changeEmail: manageExternalUser.path(changeEmail.pattern),
      changeEmailSuccess: manageExternalUser.path(changeEmailSuccess.pattern),
      activate: manageExternalUser.path(activate.pattern),
      deactivate: manageExternalUser.path(deactivate.pattern),
      deactivateReason: manageExternalUser.path(deactivate.pattern).path(reason.pattern),
    },
  },
  bulkUserRoles: {
    create: {
      root: bulkUserRolesCreate,
      jiraReference: bulkUserRolesCreate.path(jiraReference.pattern),
      selectRoles: bulkUserRolesCreate.path(selectRoles.pattern),
      uploadUsers: bulkUserRolesCreate.path(uploadUsers.pattern),
      summary: bulkUserRolesCreate.path(summary.pattern),
      submit: bulkUserRolesCreate.path(submit.pattern),
    },
    view: {
      list: bulkUserRolesView.path(requests.pattern),
      details: bulkUserRolesView.path(bulkUserRolesRequest.pattern),
      download: bulkUserRolesView.path(bulkUserRolesRequest.pattern).path(download.pattern),
    },
  },
}

export default paths
