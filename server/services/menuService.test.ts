import { NotificationMessage } from 'manageUsersApiClient'
import MenuService from './menuService'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import { MenuTile } from './menuTiles'
import manageUserAllowListHelper from '../utils/manageUserAllowListHelper'
import paths from '../routes/paths'

jest.mock('../data/manageUsersApiClient')

describe('MenuService', () => {
  const manageUsersApiClient = new ManageUsersApiClient() as jest.Mocked<ManageUsersApiClient>
  let menuService: MenuService

  beforeEach(() => {
    menuService = new MenuService(manageUsersApiClient)
  })

  describe('getBannerMessage', () => {
    it('should return empty string if user doesnt have correct role', async () => {
      const message = await menuService.getBannerMessage('test-token', ['CREATE_USER'])

      expect(message).toEqual('')
    })
    it('should return DPSMENU banner message if user has MAINTAIN_ACCESS_ROLES role', async () => {
      const message = 'Test DPS Menu Banner'
      const notificationMessage: NotificationMessage = {
        message,
      }
      manageUsersApiClient.getNotificationBannerMessage.mockResolvedValue(notificationMessage)
      const actualMessage = await menuService.getBannerMessage('test-token', ['MAINTAIN_ACCESS_ROLES'])

      expect(actualMessage).toEqual(message)
    })
    it('should return DPSMENU banner message if user has MAINTAIN_ACCESS_ROLES_ADMIN role', async () => {
      const message = 'Test DPS Menu Banner'
      const notificationMessage: NotificationMessage = {
        message,
      }
      manageUsersApiClient.getNotificationBannerMessage.mockResolvedValue(notificationMessage)
      const actualMessage = await menuService.getBannerMessage('test-token', ['MAINTAIN_ACCESS_ROLES_ADMIN'])

      expect(actualMessage).toEqual(message)
    })
  })

  describe('getTiles', () => {
    it('should return empty list of tiles when user has no roles', async () => {
      const tiles = menuService.getTiles([])

      expect(tiles).toEqual([])
    })
    it('should return empty list of tiles when manager user allow list user but manage allowlist is disabled', async () => {
      manageUserAllowListHelper.isEnabled = jest.fn(() => false)
      const tiles = menuService.getTiles(['MANAGE_USER_ALLOW_LIST'])

      expect(tiles).toEqual([])
    })
    it('should return list containing manager user allow list tiles when manage allowlist is enabled', async () => {
      manageUserAllowListHelper.isEnabled = jest.fn(() => true)
      manageUserAllowListHelper.environmentLabel = jest.fn(() => 'Stage')
      menuService = new MenuService(manageUsersApiClient)
      const tiles: MenuTile[] = menuService.getTiles(['MANAGE_USER_ALLOW_LIST'])

      expect(tiles).toEqual([
        {
          title: `Search the Stage allow list`,
          description: `Search for a user and update their access to Stage`,
          href: '/user-allow-list',
          dataQa: 'search_user_allow_list',
        },
        {
          title: `Add a user to the Stage allow list`,
          description: `Add an existing user to the Stage allow list`,
          href: '/user-allow-list/add',
          dataQa: 'add_user_to_allow_list',
        },
      ])
    })
    it('should return list containing maintain access roles tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['MAINTAIN_ACCESS_ROLES'])

      expect(tiles).toEqual([
        {
          title: `Search for a DPS user`,
          description: `Enhanced searching and managing of DPS and NOMIS users`,
          href: paths.dpsUser.search.pattern,
          dataQa: 'search_with_filter_dps_users',
        },
      ])
    })
    it('should return list containing maintain access roles tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['MAINTAIN_ACCESS_ROLES_ADMIN'])

      expect(tiles).toEqual([
        {
          title: `Search for a DPS user`,
          description: `Enhanced searching and managing of DPS and NOMIS users`,
          href: paths.dpsUser.search.pattern,
          dataQa: 'search_with_filter_dps_users',
        },
      ])
    })
    it('should only return one tile for multiple roles that are valid for that tile', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['MAINTAIN_ACCESS_ROLES', 'MAINTAIN_ACCESS_ROLES_ADMIN'])

      expect(tiles).toEqual([
        {
          title: `Search for a DPS user`,
          description: `Enhanced searching and managing of DPS and NOMIS users`,
          href: paths.dpsUser.search.pattern,
          dataQa: 'search_with_filter_dps_users',
        },
      ])
    })
    it('should return list containing create dps user tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['CREATE_USER'])

      expect(tiles).toEqual([
        {
          title: `Create a DPS user`,
          description: `Create an account for a DPS user`,
          href: paths.dpsUser.createUser.pattern,
          dataQa: 'create_dps_user_link',
        },
      ])
    })
    it('should return list containing maintain email domains tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['MAINTAIN_EMAIL_DOMAINS'])

      expect(tiles).toEqual([
        {
          title: `Manage Email Domains`,
          description: `Create, Delete and View email domain listing`,
          href: paths.emailDomains.list.pattern,
          dataQa: 'view_email_domains_link',
        },
      ])
    })
    it('should return list containing contract manager view group tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['CONTRACT_MANAGER_VIEW_GROUP'])

      expect(tiles).toEqual([
        {
          title: `Download CRS Group members`,
          description: `Select CRS Group and download list of members`,
          href: paths.crsGroups.select.pattern,
          dataQa: 'view_crs_group_users_link',
        },
      ])
    })
    it('should return list containing maintain oauth users tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['MAINTAIN_OAUTH_USERS'])

      expect(tiles).toEqual([
        {
          title: `Search for an external user`,
          description: `Search for users that typically do not have a DPS or Delius account`,
          href: paths.externalUser.search.pattern,
          dataQa: 'maintain_auth_users_link',
        },
        {
          title: `Create an external user`,
          description: `Create an account for people who do not have a DPS or Delius account`,
          href: paths.externalUser.create.pattern,
          dataQa: 'create_auth_user_link',
        },
        {
          title: `View the groups I administer`,
          description: `View and make changes to a group which contain users outside of HMPPS`,
          href: paths.groups.list.pattern,
          dataQa: 'manage_groups_link',
        },
        {
          title: `Create a group`,
          description: `Create a new group which will represent a cohort of users outside of HMPPS`,
          href: paths.groups.create.pattern,
          dataQa: 'create_groups_link',
        },
      ])
    })
    it('should return list containing auth group manager tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['AUTH_GROUP_MANAGER'])

      expect(tiles).toEqual([
        {
          title: `Search for an external user`,
          description: `Search for users that typically do not have a DPS or Delius account`,
          href: paths.externalUser.search.pattern,
          dataQa: 'maintain_auth_users_link',
        },
        {
          title: `Create an external user`,
          description: `Create an account for people who do not have a DPS or Delius account`,
          href: paths.externalUser.create.pattern,
          dataQa: 'create_auth_user_link',
        },
        {
          title: `View the groups I administer`,
          description: `View and make changes to a group which contain users outside of HMPPS`,
          href: paths.groups.list.pattern,
          dataQa: 'manage_groups_link',
        },
      ])
    })
    it('should return list containing roles admin tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['ROLES_ADMIN'])

      expect(tiles).toEqual([
        {
          title: `View roles`,
          description: `View roles that are available to be assigned to users`,
          href: paths.roles.list.pattern,
          dataQa: 'view_roles_link',
        },
        {
          title: `Create a role`,
          description: `Create a new role that can later be assigned to users`,
          href: paths.roles.create.pattern,
          dataQa: 'create_roles_link',
        },
      ])
    })
    it('should return list containing view administrable roles tiles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['VIEW_ADMINISTRABLE_USER_ROLES'])

      expect(tiles).toEqual([
        {
          title: `View roles`,
          description: `View roles that are available to be assigned to users`,
          href: paths.roles.list.pattern,
          dataQa: 'view_roles_link',
        },
      ])
    })
    it('should return list containing tiles for all roles', async () => {
      const tiles: MenuTile[] = menuService.getTiles(['VIEW_ADMINISTRABLE_USER_ROLES', 'MAINTAIN_OAUTH_USERS'])

      expect(tiles).toEqual([
        {
          title: `Search for an external user`,
          description: `Search for users that typically do not have a DPS or Delius account`,
          href: paths.externalUser.search.pattern,
          dataQa: 'maintain_auth_users_link',
        },
        {
          title: `Create an external user`,
          description: `Create an account for people who do not have a DPS or Delius account`,
          href: paths.externalUser.create.pattern,
          dataQa: 'create_auth_user_link',
        },
        {
          title: `View the groups I administer`,
          description: `View and make changes to a group which contain users outside of HMPPS`,
          href: paths.groups.list.pattern,
          dataQa: 'manage_groups_link',
        },
        {
          title: `Create a group`,
          description: `Create a new group which will represent a cohort of users outside of HMPPS`,
          href: paths.groups.create.pattern,
          dataQa: 'create_groups_link',
        },
        {
          title: `View roles`,
          description: `View roles that are available to be assigned to users`,
          href: paths.roles.list.pattern,
          dataQa: 'view_roles_link',
        },
      ])
    })
  })
})
