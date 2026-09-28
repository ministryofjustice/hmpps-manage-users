import ManageUsersApiClient from '../data/manageUsersApiClient'
import { MenuTile, RoleSpecificMenuTile } from './menuTiles'
import manageUserAllowListHelper from '../utils/manageUserAllowListHelper'
import paths from '../routes/paths'

export default class MenuService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  async getBannerMessage(token: string, userRoles: string[]): Promise<string> {
    return userRoles.includes('MAINTAIN_ACCESS_ROLES') || userRoles.includes('MAINTAIN_ACCESS_ROLES_ADMIN')
      ? this.manageUsersApiClient.getNotificationBannerMessage(token, 'DPSMENU').then(res => res.message)
      : Promise.resolve('')
  }

  getTiles(userRoles: string[]): MenuTile[] {
    const tilesForRoles = Array.from(
      userRoles
        .reduce<Map<string, RoleSpecificMenuTile>>((acc, userRole) => {
          const tilesForRole = new Map(
            this.tiles
              .filter(tile => tile.rolePredicate(userRole) && !acc.has(tile.title))
              .map(tile => [tile.title, tile]),
          )
          return new Map([...Array.from(acc.entries()), ...Array.from(tilesForRole.entries())])
        }, new Map<string, RoleSpecificMenuTile>())
        .values(),
    )
    return tilesForRoles
      .sort((a, b) => a.order - b.order)
      .map(tile => {
        const { roles, rolePredicate, order, ...menuTile } = tile
        return menuTile
      })
  }

  private allowlistEnvironment = manageUserAllowListHelper.environmentLabel()

  private manageAllowlistRoles = ['MANAGE_USER_ALLOW_LIST']

  private manageAllowlistRolePredicate: (role: string) => boolean = role =>
    this.manageAllowlistRoles.includes(role) && manageUserAllowListHelper.isEnabled()

  private tiles: RoleSpecificMenuTile[] = [
    new RoleSpecificMenuTile(
      `Search for a DPS user`,
      `Enhanced searching and managing of DPS and NOMIS users`,
      paths.dpsUser.search.pattern,
      'search_with_filter_dps_users',
      1,
      ['MAINTAIN_ACCESS_ROLES', 'MAINTAIN_ACCESS_ROLES_ADMIN'],
    ),
    new RoleSpecificMenuTile(
      `Create a DPS user`,
      `Create an account for a DPS user`,
      paths.dpsUser.createUser.pattern,
      'create_dps_user_link',
      2,
      ['CREATE_USER'],
    ),
    new RoleSpecificMenuTile(
      `Manage Email Domains`,
      `Create, Delete and View email domain listing`,
      paths.emailDomains.list.pattern,
      'view_email_domains_link',
      3,
      ['MAINTAIN_EMAIL_DOMAINS'],
    ),
    new RoleSpecificMenuTile(
      `Search for an external user`,
      `Search for users that typically do not have a DPS or Delius account`,
      paths.externalUser.search.pattern,
      'maintain_auth_users_link',
      4,
      ['MAINTAIN_OAUTH_USERS', 'AUTH_GROUP_MANAGER'],
    ),
    new RoleSpecificMenuTile(
      `Create an external user`,
      `Create an account for people who do not have a DPS or Delius account`,
      paths.externalUser.create.pattern,
      'create_auth_user_link',
      5,
      ['MAINTAIN_OAUTH_USERS', 'AUTH_GROUP_MANAGER'],
    ),
    new RoleSpecificMenuTile(
      `View the groups I administer`,
      `View and make changes to a group which contain users outside of HMPPS`,
      paths.groups.list.pattern,
      'manage_groups_link',
      6,
      ['MAINTAIN_OAUTH_USERS', 'AUTH_GROUP_MANAGER'],
    ),
    new RoleSpecificMenuTile(
      `Create a group`,
      `Create a new group which will represent a cohort of users outside of HMPPS`,
      paths.groups.create.pattern,
      'create_groups_link',
      7,
      ['MAINTAIN_OAUTH_USERS'],
    ),
    new RoleSpecificMenuTile(
      `View roles`,
      `View roles that are available to be assigned to users`,
      paths.roles.list.pattern,
      'view_roles_link',
      8,
      ['ROLES_ADMIN', 'VIEW_ADMINISTRABLE_USER_ROLES'],
    ),
    new RoleSpecificMenuTile(
      `Create a role`,
      `Create a new role that can later be assigned to users`,
      paths.roles.create.pattern,
      'create_roles_link',
      9,
      ['ROLES_ADMIN'],
    ),
    new RoleSpecificMenuTile(
      `Search the ${this.allowlistEnvironment} allow list`,
      `Search for a user and update their access to ${this.allowlistEnvironment}`,
      paths.userAllowList.search.pattern,
      'search_user_allow_list',
      10,
      this.manageAllowlistRoles,
      this.manageAllowlistRolePredicate,
    ),
    new RoleSpecificMenuTile(
      `Add a user to the ${this.allowlistEnvironment} allow list`,
      `Add an existing user to the ${this.allowlistEnvironment} allow list`,
      paths.userAllowList.addUser.pattern,
      'add_user_to_allow_list',
      11,
      this.manageAllowlistRoles,
      this.manageAllowlistRolePredicate,
    ),
    new RoleSpecificMenuTile(
      `Download CRS Group members`,
      `Select CRS Group and download list of members`,
      paths.crsGroups.select.pattern,
      'view_crs_group_users_link',
      12,
      ['CONTRACT_MANAGER_VIEW_GROUP'],
    ),
    new RoleSpecificMenuTile(
      `Change user roles in bulk`,
      `Add roles to a list of users in bulk via a Jira reference and a csv file of user ids`,
      paths.bulkUserRoles.create.root.pattern,
      'create_bulk_user_roles_link',
      13,
      ['MANAGE_USER_BULK_JOBS'],
    ),
    new RoleSpecificMenuTile(
      `View bulk role changes`,
      `View the progress and results of bulk user role addition requests`,
      paths.bulkUserRoles.view.list.pattern,
      'view_bulk_user_roles_link',
      14,
      ['MANAGE_USER_BULK_JOBS'],
    ),
  ]
}
