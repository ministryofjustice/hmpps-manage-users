// This needs to be put into a centralised route config that is also used in App.js
// See: https://reacttraining.com/react-router/web/example/route-config
import AuthUserBreadcrumb from './Components/Breadcrumb/AuthUserBreadcrumb'

export default [
  { path: '/', breadcrumb: 'Maintain HMPPS Users' },
  { path: '/maintain-roles', breadcrumb: 'Manage NOMIS user roles' },
  { path: '/create-auth-user', breadcrumb: 'Create auth user' },
  { path: '/maintain-auth-users', breadcrumb: 'Maintain auth users' },
  { path: '/maintain-auth-users/search-results', breadcrumb: 'Results' },
  { path: '/maintain-auth-users/:username', breadcrumb: AuthUserBreadcrumb },
  { path: '/maintain-auth-users/:username/add-role', breadcrumb: 'Add role' },
  { path: '/maintain-auth-users/:username/add-group', breadcrumb: 'Add group' },
  { path: '/maintain-roles/:staffId/roles', breadcrumb: 'Current profile roles' },
  { path: '/maintain-roles/:staffId/roles/add-role', breadcrumb: 'Add role' },
  { path: '/maintain-roles/search-results', breadcrumb: 'Results' },
  { path: '/maintain-roles/:staffId', breadcrumb: null },
]
