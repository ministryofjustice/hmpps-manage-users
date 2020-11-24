// This needs to be put into a centralised route config that is also used in App.js
// See: https://reacttraining.com/react-router/web/example/route-config
import AuthUserBreadcrumb from './Components/Breadcrumb/AuthUserBreadcrumb'

export default [
  { path: '/', breadcrumb: 'Manage user accounts' },
  { path: '/maintain-roles', breadcrumb: 'Manage user roles' },
  { path: '/create-external-user', breadcrumb: 'Create external users' },
  { path: '/maintain-external-users', breadcrumb: 'Maintain external users' },
  { path: '/maintain-external-users/search-results', breadcrumb: 'Results' },
  { path: '/maintain-external-users/:username', breadcrumb: AuthUserBreadcrumb },
  { path: '/maintain-external-users/:username/add-role', breadcrumb: 'Add role' },
  { path: '/maintain-external-users/:username/add-group', breadcrumb: 'Add group' },
  { path: '/maintain-roles/:staffId', breadcrumb: 'Current profile roles' },
  { path: '/maintain-roles/:staffId/add-role', breadcrumb: 'Add role' },
  { path: '/maintain-roles/search-results', breadcrumb: 'Results' },
  { path: '/maintain-roles/:staffId', breadcrumb: null },
]
