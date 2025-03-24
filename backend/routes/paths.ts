import { path } from 'static-path'

const userAllowList = path('/user-allow-list')
const downloadUserAllowList = userAllowList.path('download')
const addUserToAllowList = userAllowList.path('add')
const viewUserAllowListDetail = userAllowList.path(':username/view')
const editUserAllowListDetail = userAllowList.path(':username/edit')

const paths = {
  userAllowList: {
    addUser: addUserToAllowList,
    download: downloadUserAllowList,
    search: userAllowList,
    viewUser: viewUserAllowListDetail,
    editUser: editUserAllowListDetail,
  },
}

export default paths
