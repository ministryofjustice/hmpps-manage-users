import { path } from 'static-path'

const userAllowList = path('/user-allow-list')
const addUserToAllowList = userAllowList.path('add')
const viewUserAllowListDetail = userAllowList.path(':username/view')
const editUserAllowListDetail = userAllowList.path(':username/edit')

const paths = {
  userAllowList: {
    addUser: addUserToAllowList,
    search: userAllowList,
    viewUser: viewUserAllowListDetail,
    editUser: editUserAllowListDetail,
  },
}

export default paths
