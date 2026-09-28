import nock, { DataMatcherMap } from 'nock'
import {
  ChildGroup,
  CreateChildGroupRequest,
  CreateLinkedCentralAdminRequest,
  CreateLinkedGeneralUserRequest,
  CreateLinkedLocalAdminRequest,
  CreateUserRequest,
  EmailAddress,
  ExternalUser,
  ExternalUserRole,
  Group,
  NotificationMessage,
  PagedList,
  PrisonAdminUserSummary,
  PrisonCaseload,
  PrisonStaffUser,
  PrisonUserDetails,
  PrisonUserDownloadSummary,
  PrisonUserSearchSummary,
  Role,
  UpdateRoleAdminTypeRequest,
  UpdateRoleDescriptionRequest,
  UpdateRoleNameRequest,
  User,
  UserAllowlistAddRequest,
  UserAllowlistDetail,
  UserAllowlistPatchRequest,
  UserCaseloadDetail,
  UserGroup,
  UserRole,
  UserRoleDetail,
} from 'manageUsersApiClient'
import { URLSearchParams } from 'url'
import { ParsedUrlQuery } from 'querystring'
import config from '../config'
import ManageUsersApiClient from './manageUsersApiClient'
import createPagedList from '../testutils/pagedListHelper'
import { HttpStatusCode, toArray } from '../utils/utils'

const successResponse = HttpStatusCode.OK
const token = 'test-system-token'
const mockApi = (
  method: string,
  uri: string,
  responseCode: number,
  body?: nock.Body,
  query: boolean | string | DataMatcherMap | URLSearchParams | { (parsedObj: ParsedUrlQuery): boolean } = {},
): nock.Scope => {
  return nock(config.apis.manageUsersApi.url)
    .intercept(uri, method)
    .query(query)
    .matchHeader('authorization', `Bearer ${token}`)
    .reply(responseCode, body)
}

describe('ManageUsersApiClient', () => {
  let manageUsersApiClient: ManageUsersApiClient

  beforeEach(() => {
    manageUsersApiClient = new ManageUsersApiClient()
  })

  afterEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  describe('Email Domain Endpoints', () => {
    describe('create email domain', () => {
      it('should return 200 status', async () => {
        const emailDomain = {
          id: '46bbbe2f-fe26-4f2b-b0e4-21967f0fa8f8',
          domain: 'justice.test.uk',
          description: 'test domain',
        }
        mockApi('post', '/email-domains', successResponse, emailDomain)

        const response = await manageUsersApiClient.createEmailDomain(token, {
          name: 'justice.test.uk',
          description: 'test domain',
        })
        expect(response).toEqual(emailDomain)
      })
    })

    describe('delete email domain', () => {
      it('should return 200 status', async () => {
        const domainId = 'test-domain-id'
        mockApi('delete', `/email-domains/${domainId}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.deleteEmailDomain(token, domainId)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('get all email domains', () => {
      it('should return list of email domains', async () => {
        const emailDomains = [
          {
            id: 'test-domain-1',
            domain: 'test.justice.gov.uk',
            description: 'test justice domain',
          },
        ]
        mockApi('get', '/email-domains', successResponse, emailDomains)

        const response = await manageUsersApiClient.getAllEmailDomains(token)
        expect(response).toEqual(emailDomains)
      })
    })

    describe('get an email domain', () => {
      it('should return the email domain', async () => {
        const domainId = 'test-domain-id'
        const emailDomain = {
          id: 'test-domain-1',
          domain: 'test.justice.gov.uk',
          description: 'test justice domain',
        }

        mockApi('get', `/email-domains/${domainId}`, successResponse, emailDomain)

        const response = await manageUsersApiClient.getEmailDomain(token, domainId)
        expect(response).toEqual(emailDomain)
      })
    })
  })

  describe('External Users Endpoints', () => {
    describe('create external user', () => {
      it('should return created user UUID', async () => {
        const createdUserId = '3b6b739a-a076-4d14-a3be-ebe302ada5f7'
        mockApi('post', '/externalusers/create', successResponse, createdUserId)

        const response = await manageUsersApiClient.createExternalUser(token, {
          firstName: 'Tresa',
          lastName: 'Brigman',
          email: 'tresa.brigman@justice.gov.uk',
        })
        expect(response).toEqual(createdUserId)
      })
    })

    describe('get user', () => {
      it(' should return user', async () => {
        const userId = '3b6b739a-a076-4d14-a3be-ebe302ada5f7'
        const user = {
          userId,
          username: 'demareoz',
          firstName: 'Tresa',
          lastName: 'Brigman',
          email: 'tresa.brigman@justice.gov.uk',
          locked: false,
          enabled: true,
          verified: true,
          lastLoggedIn: '24/06/2025',
        }
        mockApi('get', `/externalusers/id/${userId}`, successResponse, user)

        const response = await manageUsersApiClient.getUser(token, userId)
        expect(response).toEqual(user)
      })
    })

    describe('get users in CRS groups', () => {
      it('should return list of users', async () => {
        const groupCode = 'CRS_GROUP_TEST'
        const users: ExternalUser[] = [
          {
            userId: '3b6b739a-a076-4d14-a3be-ebe302ada5f7',
            username: 'demareoz',
            firstName: 'Tresa',
            lastName: 'Brigman',
            email: 'tresa.brigman@justice.gov.uk',
            locked: false,
            enabled: true,
            verified: true,
            lastLoggedIn: '24/06/2025',
          },
        ]
        mockApi('get', `/externalusers/crsgroup/${groupCode}`, successResponse, users)

        const response = await manageUsersApiClient.getUsersInCRSGroup(token, groupCode)
        expect(response).toEqual(users)
      })
    })

    describe('assignable groups', () => {
      it('should return assignable groups', async () => {
        const groups: UserGroup[] = [
          {
            groupCode: 'TEST_GROUP',
            groupName: 'Test Group',
          },
        ]
        mockApi('get', '/externalusers/me/assignable-groups', successResponse, groups)

        const response = await manageUsersApiClient.assignableGroups(token)
        expect(response).toEqual(groups)
      })
    })

    describe('searchable roles', () => {
      it('should return searchable roles', async () => {
        const roles: UserRole[] = [
          {
            roleCode: 'ROLE_TEST',
            roleName: 'Test role',
            roleDescription: 'Test role description',
          },
        ]
        mockApi('get', '/externalusers/me/searchable-roles', successResponse, roles)

        const response = await manageUsersApiClient.searchableRoles(token)
        expect(response).toEqual(roles)
      })
    })

    describe('user search', () => {
      it('should return filtered list of users', async () => {
        const filter = {
          nameFilter: 'Tresa',
          role: 'ROLE_TEST',
          group: 'TEST_GROUP',
          status: 'ACTIVE',
        }
        const page: number = 0
        const size: number = 20
        const users = createPagedList<ExternalUser>([
          {
            userId: '3b6b739a-a076-4d14-a3be-ebe302ada5f7',
            username: 'demareoz',
            firstName: 'Tresa',
            lastName: 'Brigman',
            email: 'tresa.brigman@justice.gov.uk',
            locked: false,
            enabled: true,
            verified: true,
            lastLoggedIn: '24/06/2025',
          },
        ])
        mockApi('get', '/externalusers/search', successResponse, users, {
          name: filter.nameFilter,
          groups: filter.group,
          roles: filter.role,
          status: filter.status,
          page,
          size,
        })

        const response = await manageUsersApiClient.userSearch(token, filter, page, size)
        expect(response).toEqual(users)
      })
    })

    describe('assignable roles', () => {
      it('should return assignable roles', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        const roles: UserRole[] = [
          {
            roleCode: 'ROLE_TEST',
            roleName: 'Test role',
            roleDescription: 'Test role description',
          },
        ]
        mockApi('get', `/externalusers/${userId}/assignable-roles`, successResponse, roles)

        const response = await manageUsersApiClient.assignableRoles(token, userId)
        expect(response).toEqual(roles)
      })
    })

    describe('deactivate external user', () => {
      it('should return 200', async () => {
        const reason = 'left project'
        const userId = 'tresa.brigman@justice.gov.uk'
        mockApi('put', `/externalusers/${userId}/disable`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.deactivateExternalUser(token, userId, reason)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('disable external user', () => {
      it('should return 200', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        mockApi('put', `/externalusers/${userId}/disable`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.disableExternalUser(token, userId)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('amend user email', () => {
      it('should return 200', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        const newEmail = 'tresa.brigman@digital.justice.gov.uk'
        mockApi('post', `/externalusers/${userId}/email`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.amendUserEmail(token, userId, newEmail)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('enable external user', () => {
      it('should return 200', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        mockApi('put', `/externalusers/${userId}/enable`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.enableExternalUser(token, userId)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('add user group', () => {
      it('should return 200', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        const group = 'TEST_GROUP'
        mockApi('put', `/externalusers/${userId}/groups/${group}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.addUserGroup(token, userId, group)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('remove user group', () => {
      it('should return 200', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        const group = 'TEST_GROUP'
        mockApi('delete', `/externalusers/${userId}/groups/${group}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.removeUserGroup(token, userId, group)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('user groups', () => {
      it('should return user groups', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        const groups: UserGroup[] = [
          {
            groupCode: 'TEST_GROUP',
            groupName: 'Test group',
          },
        ]
        mockApi('get', `/externalusers/${userId}/groups`, successResponse, groups, { children: false })

        const response = await manageUsersApiClient.userGroups(token, userId)
        expect(response).toEqual(groups)
      })
    })

    describe('add roles', () => {
      it('should return 200', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        const roles = ['ROLE_TEST', 'ROLE_TEST_ADMIN']
        mockApi('post', `/externalusers/${userId}/roles`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.externalUserAddRoles(token, userId, roles)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('user roles', () => {
      it('should return user roles', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        const roles: string[] = ['ROLE_TEST', 'ROLE_TEST_ADMIN']
        mockApi('get', `/externalusers/${userId}/roles`, successResponse, roles)

        const response = await manageUsersApiClient.externalUserRoles(token, userId)
        expect(response).toEqual(roles)
      })
    })

    describe('delete user role', () => {
      it('should return 200', async () => {
        const userId = 'tresa.brigman@justice.gov.uk'
        const role = 'ROLE_TEST_ADMIN'
        mockApi('delete', `/externalusers/${userId}/roles/${role}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.deleteExternalUserRole(token, userId, role)
        expect(response.status).toEqual(successResponse)
      })
    })
  })

  describe('Group Endpoints', () => {
    describe('create child group', () => {
      it('should return 200', async () => {
        const request: CreateChildGroupRequest = {
          parentGroupCode: 'PARENT',
          groupCode: 'CHILD',
          groupName: 'Child group',
        }
        mockApi('post', '/groups/child', successResponse, { status: successResponse })

        const response = await manageUsersApiClient.createChildGroup(token, request)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('change child group name', () => {
      it('should return 200', async () => {
        const group = 'CHILD'
        const newGroupName = 'New Child group'
        mockApi('put', `/groups/child/${group}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.changeChildGroupName(token, group, { groupName: newGroupName })
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('child group details', () => {
      it('should return child group details', async () => {
        const group = 'CHILD'
        const details: ChildGroup = {
          groupName: 'Child group',
          groupCode: group,
        }
        mockApi('get', `/groups/child/${group}`, successResponse, details)

        const response = await manageUsersApiClient.childGroupDetails(token, group)
        expect(response).toEqual(details)
      })
    })

    describe('delete child group', () => {
      it('should return 200', async () => {
        const group = 'CHILD'
        mockApi('delete', `/groups/child/${group}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.deleteChildGroup(token, group)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('create group', () => {
      it('should return 200', async () => {
        const request: CreateChildGroupRequest = {
          groupCode: 'TEST_GROUP',
          groupName: 'Test group',
        }
        mockApi('post', '/groups', successResponse, { status: successResponse })

        const response = await manageUsersApiClient.createGroup(token, request)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('change group name', () => {
      it('should return 200', async () => {
        const group = 'TEST_GROUP'
        const newGroupName = 'New group'
        mockApi('put', `/groups/${group}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.changeGroupName(token, group, { groupName: newGroupName })
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('group details', () => {
      it('should return child group details', async () => {
        const group = 'TEST_GROUP'
        const details: Group = {
          groupName: 'Test group',
          groupCode: group,
          children: [
            {
              groupCode: 'CHILD_GROUP',
              groupName: 'Child group',
            },
          ],
          assignableRoles: [
            {
              roleCode: 'ROLE_TEST',
              roleName: 'Test role',
            },
          ],
        }
        mockApi('get', `/groups/${group}`, successResponse, details)

        const response = await manageUsersApiClient.groupDetails(token, group)
        expect(response).toEqual(details)
      })
    })

    describe('delete group', () => {
      it('should return 200', async () => {
        const group = 'TEST_GROUP'
        mockApi('delete', `/groups/${group}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.deleteGroup(token, group)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('get all crs user groups', () => {
      it('should return user groups', async () => {
        const groups: UserGroup[] = [
          {
            groupCode: 'TEST_GROUP',
            groupName: 'Test group',
          },
        ]
        mockApi('get', `/groups/subset/crs`, successResponse, groups)

        const response = await manageUsersApiClient.getAllCRSGroups(token)
        expect(response).toEqual(groups)
      })
    })
  })

  describe('Linked Prison Users Endpoints', () => {
    describe('create linked central admin user', () => {
      it('should return linked prsion staff user', async () => {
        const request: CreateLinkedCentralAdminRequest = {
          existingUsername: 'TUSER_GEN',
          adminUsername: 'TUSER_ADM',
        }
        const staffUser: PrisonStaffUser = {
          firstName: 'Test',
          lastName: 'User',
          staffId: 12345,
          status: 'ACTIVE',
          primaryEmail: 'test.user@justice.gov.uk',
          generalAccount: {
            username: 'TUSER_GEN',
            accountType: 'GENERAL',
          },
          adminAccount: {
            username: 'TUSER_ADM',
            accountType: 'ADMIN',
          },
        }
        mockApi('post', '/linkedprisonusers/admin', successResponse, staffUser)

        const response = await manageUsersApiClient.createLinkedCentralAdminUser(token, request)
        expect(response).toEqual(staffUser)
      })
    })

    describe('create linked general user', () => {
      it('should return linked prsion staff user', async () => {
        const request: CreateLinkedGeneralUserRequest = {
          existingAdminUsername: 'TUSER_ADM',
          generalUsername: 'TUSER_GEN',
          defaultCaseloadId: 'TESTCASELOAD',
        }
        const staffUser: PrisonStaffUser = {
          firstName: 'Test',
          lastName: 'User',
          staffId: 12345,
          status: 'ACTIVE',
          primaryEmail: 'test.user@justice.gov.uk',
          generalAccount: {
            username: 'TUSER_GEN',
            accountType: 'GENERAL',
          },
          adminAccount: {
            username: 'TUSER_ADM',
            accountType: 'ADMIN',
          },
        }
        mockApi('post', '/linkedprisonusers/general', successResponse, staffUser)

        const response = await manageUsersApiClient.createLinkedGeneralUser(token, request)
        expect(response).toEqual(staffUser)
      })
    })

    describe('create linked lsa user', () => {
      it('should return linked prsion staff user', async () => {
        const request: CreateLinkedLocalAdminRequest = {
          existingUsername: 'TUSER_GEN',
          adminUsername: 'TUSER_ADM',
          localAdminGroup: 'TEST_GROUP',
        }
        const staffUser: PrisonStaffUser = {
          firstName: 'Test',
          lastName: 'User',
          staffId: 12345,
          status: 'ACTIVE',
          primaryEmail: 'test.user@justice.gov.uk',
          generalAccount: {
            username: 'TUSER_GEN',
            accountType: 'GENERAL',
          },
          adminAccount: {
            username: 'TUSER_ADM',
            accountType: 'ADMIN',
          },
        }
        mockApi('post', '/linkedprisonusers/lsa', successResponse, staffUser)

        const response = await manageUsersApiClient.createLinkedLsaUser(token, request)
        expect(response).toEqual(staffUser)
      })
    })
  })

  describe('Notification Endpoints', () => {
    describe('get notification banner message', () => {
      it('should return notification message', async () => {
        const notificationType = 'TEST_NOTIFICATION'
        const notificationMessage: NotificationMessage = { message: 'Test banner message' }
        mockApi('get', `/notification/banner/${notificationType}`, successResponse, notificationMessage)

        const response = await manageUsersApiClient.getNotificationBannerMessage(token, notificationType)
        expect(response).toEqual(notificationMessage)
      })
    })
  })

  describe('Prison Users Endpoints', () => {
    describe('create user', () => {
      it('should return new prison staff user', async () => {
        const request: CreateUserRequest = {
          username: 'TUSER_GEN',
          firstName: 'Test',
          lastName: 'User',
          email: 'test.user@justice.gov.uk',
          userType: 'DPS_GEN',
        }
        const staffUser: PrisonStaffUser = {
          username: 'TUSER_GEN',
          firstName: 'Test',
          lastName: 'User',
          primaryEmail: 'test.user@justice.gov.uk',
        }
        mockApi('post', '/prisonusers', successResponse, staffUser)

        const response = await manageUsersApiClient.createUser(token, request)
        expect(response).toEqual(staffUser)
      })
    })

    describe('download lsa search', () => {
      it('should return filtered list of users', async () => {
        const filter = {
          nameFilter: 'Test',
          accessRoles: ['ROLE_TEST'],
          status: 'ACTIVE',
          caseload: 'TESTCASELOAD',
          activeCaseload: 'TESTCASELOAD',
          inclusiveRoles: false,
          showOnlyLSAs: true,
        }
        const lsaUsers: PrisonAdminUserSummary = [
          {
            username: 'TUSER_GEN',
            staffId: '12345',
            firstName: 'Test',
            lastName: 'User',
            active: true,
            locked: false,
            expired: false,
            dpsRoleCount: 1,
            groups: [
              {
                id: 'TEST_GROUP',
                name: 'Test Group',
              },
            ],
          },
        ]
        const query = {
          nameFilter: filter.nameFilter,
          accessRoles: filter.accessRoles[0],
          status: filter.status,
          caseload: filter.caseload,
          activeCaseload: filter.activeCaseload,
          inclusiveRoles: filter.inclusiveRoles,
          showOnlyLSAs: filter.showOnlyLSAs,
        }
        mockApi('get', '/prisonusers/download/admins', successResponse, lsaUsers, query)

        const response = await manageUsersApiClient.downloadLsaSearch(token, filter)
        expect(response).toEqual(lsaUsers)
      })
    })

    describe('download user search', () => {
      it('should return filtered list of users', async () => {
        const filter = {
          nameFilter: 'Test',
          accessRoles: ['ROLE_TEST'],
          status: 'ACTIVE',
          caseload: 'TESTCASELOAD',
          activeCaseload: 'TESTCASELOAD',
          inclusiveRoles: false,
          showOnlyLSAs: true,
        }
        const prisonUsers: PrisonUserDownloadSummary = [
          {
            username: 'TUSER_GEN',
            staffId: '12345',
            firstName: 'Test',
            lastName: 'User',
            active: true,
          },
        ]
        const query = {
          nameFilter: filter.nameFilter,
          accessRoles: filter.accessRoles[0],
          status: filter.status,
          caseload: filter.caseload,
          activeCaseload: filter.activeCaseload,
          inclusiveRoles: filter.inclusiveRoles,
          showOnlyLSAs: filter.showOnlyLSAs,
        }
        mockApi('get', '/prisonusers/download', successResponse, prisonUsers, query)

        const response = await manageUsersApiClient.downloadUserSearch(token, filter)
        expect(response).toEqual(prisonUsers)
      })
    })

    describe('get caseloads', () => {
      it('should return the list of caseloads', async () => {
        const caseloads: PrisonCaseload[] = [
          {
            id: 'TPR',
            name: 'Test Prison',
          },
          {
            id: 'TSP',
            name: 'Test Secure Prison',
          },
        ]
        mockApi('get', '/prisonusers/reference-data/caseloads', successResponse, caseloads)

        const response = await manageUsersApiClient.getCaseloads(token)
        expect(response).toEqual(caseloads)
      })
    })

    describe('dps user search', () => {
      it('should return filtered list of users', async () => {
        const filter = {
          nameFilter: 'Test',
          accessRoles: ['ROLE_TEST'],
          status: 'ACTIVE',
          caseload: 'TESTCASELOAD',
          activeCaseload: 'TESTCASELOAD',
          inclusiveRoles: false,
          showOnlyLSAs: true,
          size: 20,
          page: 0,
        }
        const prisonUsers: PagedList<PrisonUserSearchSummary> = createPagedList<PrisonUserSearchSummary>([
          {
            username: 'TUSER_GEN',
            staffId: '12345',
            firstName: 'Test',
            lastName: 'User',
            active: true,
            locked: false,
            expired: false,
            dpsRoleCount: 1,
            staffStatus: 'ACTIVE',
          },
        ])
        const query = {
          nameFilter: filter.nameFilter,
          accessRoles: filter.accessRoles[0],
          status: filter.status,
          caseload: filter.caseload,
          activeCaseload: filter.activeCaseload,
          inclusiveRoles: filter.inclusiveRoles,
          showOnlyLSAs: filter.showOnlyLSAs,
          size: filter.size,
          page: filter.page,
        }
        mockApi('get', '/prisonusers/search', successResponse, prisonUsers, query)

        const response = await manageUsersApiClient.dpsUserSearch(token, filter)
        expect(response).toEqual(prisonUsers)
      })
    })

    describe('add user caseloads', () => {
      it('should return the updated user caseload details', async () => {
        const username = 'TUSER_GEN'
        const caseloads: string[] = ['TPR', 'TSP']
        const caseloadDetail: UserCaseloadDetail = {
          username,
          active: true,
          accountType: 'GENERAL',
          caseloads: [
            {
              id: 'TPR',
              name: 'Test Prison',
            },
            {
              id: 'TSP',
              name: 'Test Secure Prison',
            },
          ],
        }
        mockApi('post', `/prisonusers/${username}/caseloads`, successResponse, caseloadDetail)

        const response = await manageUsersApiClient.addUserCaseloads(token, username, caseloads)
        expect(response).toEqual(caseloadDetail)
      })
    })

    describe('remove user caseload', () => {
      it('should return the updated user caseload details', async () => {
        const username = 'TUSER_GEN'
        const caseloadId: string = 'TSP'
        const caseloadDetail: UserCaseloadDetail = {
          username,
          active: true,
          accountType: 'GENERAL',
          caseloads: [
            {
              id: 'TPR',
              name: 'Test Prison',
            },
          ],
        }
        mockApi('delete', `/prisonusers/${username}/caseloads/${caseloadId}`, successResponse, caseloadDetail)

        const response = await manageUsersApiClient.removeUserCaseload(token, username, caseloadId)
        expect(response).toEqual(caseloadDetail)
      })
    })

    describe('current user caseloads', () => {
      it('should return the user caseload details for nomis auth source', async () => {
        const username = 'TUSER_GEN'
        const caseloadDetail: UserCaseloadDetail = {
          username,
          active: true,
          accountType: 'GENERAL',
          caseloads: [
            {
              id: 'TPR',
              name: 'Test Prison',
            },
          ],
        }
        mockApi('get', `/prisonusers/${username}/caseloads`, successResponse, caseloadDetail)

        const response = await manageUsersApiClient.currentUserCaseloads(token, 'nomis', username)
        expect(response).toEqual(caseloadDetail)
      })
      it('should return empty user caseload details for auth auth source', async () => {
        const username = 'TUSER_GEN'
        const caseloadDetail: UserCaseloadDetail = {}
        mockApi('get', `/prisonusers/${username}/caseloads`, successResponse, caseloadDetail)

        const response = await manageUsersApiClient.currentUserCaseloads(token, 'auth', username)
        expect(response).toEqual(caseloadDetail)
      })
    })

    describe('get user caseloads', () => {
      it('should return the user caseload details', async () => {
        const username = 'TUSER_GEN'
        const caseloadDetail: UserCaseloadDetail = {
          username,
          active: true,
          accountType: 'GENERAL',
          caseloads: [
            {
              id: 'TPR',
              name: 'Test Prison',
            },
          ],
        }
        mockApi('get', `/prisonusers/${username}/caseloads`, successResponse, caseloadDetail)

        const response = await manageUsersApiClient.getUserCaseloads(token, username)
        expect(response).toEqual(caseloadDetail)
      })
    })

    describe('disable prison user', () => {
      it('should return 200', async () => {
        const username = 'TUSER_GEN'
        mockApi('put', `/prisonusers/${username}/disable-user`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.disablePrisonUser(token, username)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('get dps user', () => {
      it('should return the user details', async () => {
        const username = 'TUSER_GEN'
        const prisonUser: PrisonUserDetails = {
          username: 'TUSER_GEN',
          staffId: 12345,
          firstName: 'Test',
          lastName: 'User',
          accountType: 'GENERAL',
          enabled: true,
          active: true,
          userId: 12345,
          name: 'Test User',
          authSource: 'nomis',
        }
        mockApi('get', `/prisonusers/${username}/details`, successResponse, prisonUser)

        const response = await manageUsersApiClient.getDpsUser(token, username)
        expect(response).toEqual(prisonUser)
      })
    })

    describe('change dps email', () => {
      it('should return empty string', async () => {
        const username = 'TUSER_GEN'
        const newEmail = 'test.user@digital.justice.gov.uk'
        mockApi('post', `/prisonusers/${username}/email`, successResponse, '')

        const response = await manageUsersApiClient.changeDpsEmail(token, username, newEmail)
        expect(response).toEqual('')
      })
    })

    describe('enable prison user', () => {
      it('should return 200', async () => {
        const username = 'TUSER_GEN'
        mockApi('put', `/prisonusers/${username}/enable-user`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.enablePrisonUser(token, username)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('sync dps email', () => {
      it('should return 200', async () => {
        const username = 'TUSER_GEN'
        mockApi('post', `/prisonusers/${username}/email/sync`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.syncDpsEmail(token, username)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('add dps user roles', () => {
      it('should return updated user role detail', async () => {
        const username = 'TUSER_GEN'
        const roles: string[] = ['ROLE_TEST', 'ROLE_ADMIN_TEST']
        const userRoleDetail: UserRoleDetail = {
          username,
          active: true,
          accountType: 'GENERAL',
          dpsRoles: [
            {
              code: 'ROLE_TEST',
              name: 'Test role',
              sequence: 1,
              type: 'APP',
              adminRoleOnly: false,
            },
            {
              code: 'ROLE_ADMIN_TEST',
              name: 'Test admin role',
              sequence: 1,
              type: 'APP',
              adminRoleOnly: true,
            },
          ],
        }
        mockApi('post', `/prisonusers/${username}/roles`, successResponse, userRoleDetail)

        const response = await manageUsersApiClient.addDpsUserRoles(token, username, roles)
        expect(response).toEqual(userRoleDetail)
      })
    })

    describe('context user roles', () => {
      it('should return user role detail', async () => {
        const username = 'TUSER_GEN'
        const userRoleDetail: UserRoleDetail = {
          username,
          active: true,
          accountType: 'GENERAL',
          dpsRoles: [
            {
              code: 'ROLE_TEST',
              name: 'Test role',
              sequence: 1,
              type: 'APP',
              adminRoleOnly: false,
            },
            {
              code: 'ROLE_ADMIN_TEST',
              name: 'Test admin role',
              sequence: 1,
              type: 'APP',
              adminRoleOnly: true,
            },
          ],
        }
        mockApi('get', `/prisonusers/${username}/roles`, successResponse, userRoleDetail)

        const response = await manageUsersApiClient.getDpsUserRoles(token, username)
        expect(response).toEqual(userRoleDetail)
      })
    })

    describe('remove dps user role', () => {
      it('should return updated user role detail', async () => {
        const username = 'TUSER_GEN'
        const roleCode = 'ROLE_ADMIN_TEST'
        const userRoleDetail: UserRoleDetail = {
          username,
          active: true,
          accountType: 'GENERAL',
          dpsRoles: [
            {
              code: 'ROLE_TEST',
              name: 'Test role',
              sequence: 1,
              type: 'APP',
              adminRoleOnly: false,
            },
          ],
        }
        mockApi('delete', `/prisonusers/${username}/roles/${roleCode}`, successResponse, userRoleDetail)

        const response = await manageUsersApiClient.removeDpsUserRole(token, username, roleCode)
        expect(response).toEqual(userRoleDetail)
      })
    })
  })

  describe('Roles Endpoints', () => {
    describe('create role', () => {
      it('should return 200', async () => {
        const role = 'ROLE_TEST'
        mockApi('post', '/roles', successResponse, { status: successResponse })

        const response = await manageUsersApiClient.createRole(token, role)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('get roles', () => {
      it('should return list of roles for admin type', async () => {
        const adminType = 'DPS_ADM'
        const roles: Role[] = [
          {
            roleCode: 'ROLE_TEST',
            roleName: 'Test role',
            roleDescription: 'Test role to allow this test to pass',
            adminType: [
              {
                adminTypeCode: 'DPS_ADM',
                adminTypeName: 'Central DPS Administrator',
              },
            ],
          },
        ]
        mockApi('get', '/roles', successResponse, roles, { adminTypes: adminType })

        const response = await manageUsersApiClient.getRoles(token, adminType)
        expect(response).toEqual(roles)
      })
    })

    describe('get paged roles', () => {
      it('should return list of roles for admin type', async () => {
        const adminType = 'DPS_ADM'
        const page = 0
        const size = 20
        const roleName = 'Test role'
        const roleCode = 'ROLE_TEST'
        const roles: PagedList<Role> = createPagedList([
          {
            roleCode: 'ROLE_TEST',
            roleName: 'Test role',
            roleDescription: 'Test role to allow this test to pass',
            adminType: [
              {
                adminTypeCode: 'DPS_ADM',
                adminTypeName: 'Central DPS Administrator',
              },
            ],
          },
        ])
        mockApi('get', '/roles/paged', successResponse, roles, {
          page,
          size,
          roleName,
          roleCode,
          adminTypes: adminType,
        })

        const response = await manageUsersApiClient.getPagedRoles(token, {
          page,
          size,
          roleName,
          roleCode,
          adminTypes: toArray<'DPS_ADM' | 'DPS_LSA' | 'EXT_ADM' | 'IMS_HIDDEN'>(adminType),
        })
        expect(response).toEqual(roles)
      })
    })

    describe('get role details', () => {
      it('should return the role details', async () => {
        const roleCode = 'ROLE_TEST'
        const role: Role = {
          roleCode,
          roleName: 'Test role',
          roleDescription: 'Test role to allow this test to pass',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'Central DPS Administrator',
            },
          ],
        }
        mockApi('get', `/roles/${roleCode}`, successResponse, role)

        const response = await manageUsersApiClient.getRoleDetails(token, roleCode)
        expect(response).toEqual(role)
      })
    })

    describe('change role name', () => {
      it('should return 200', async () => {
        const roleCode = 'ROLE_TEST'
        const request: UpdateRoleNameRequest = {
          roleName: 'Updated Test Role',
        }
        mockApi('put', `/roles/${roleCode}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.changeRoleName(token, roleCode, request)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('change role admin type', () => {
      it('should return 200', async () => {
        const roleCode = 'ROLE_TEST'
        const request: UpdateRoleAdminTypeRequest = {
          adminType: 'DPS_LSA',
        }
        mockApi('put', `/roles/${roleCode}/admintype`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.changeRoleAdminType(token, roleCode, request)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('change role description', () => {
      it('should return 200', async () => {
        const roleCode = 'ROLE_TEST'
        const request: UpdateRoleDescriptionRequest = {
          roleDescription: 'Updated role description',
        }
        mockApi('put', `/roles/${roleCode}/description`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.changeRoleDescription(token, roleCode, request)
        expect(response.status).toEqual(successResponse)
      })
    })
  })

  describe('Users Endpoints', () => {
    describe('add allowlist user', () => {
      it('should return 200', async () => {
        const request: UserAllowlistAddRequest = {
          username: 'TUSER_GEN',
          email: 'test.user@justice.gov.uk',
          firstName: 'Test',
          lastName: 'User',
          reason: 'For testing purposes',
          accessPeriod: 'ONE_MONTH',
        }
        mockApi('post', '/users/allowlist', successResponse, { status: successResponse })

        const response = await manageUsersApiClient.addAllowlistUser(token, request)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('get all allowlist users', () => {
      it('should return paged list of allow list users', async () => {
        const allowlistUsers: PagedList<UserAllowlistDetail> = createPagedList([
          {
            id: '611154f6-d360-4e1f-91bc-354104dcfa08',
            username: 'TUSER_GEN',
            email: 'test.user@justice.gov.uk',
            firstName: 'Test',
            lastName: 'User',
            reason: 'For testing purposes',
            createdOn: '04/08/2025T15:53:38.506',
            allowlistEndDate: '04/08/2026',
            lastUpdated: '04/08/2025T15:53:38.506',
            lastUpdatedBy: 'TUSER_ADM',
            userType: 'DIGITAL',
          },
        ])
        const query = {
          status: 'ALL',
          size: 20,
          page: 0,
        }
        mockApi('get', '/users/allowlist', successResponse, allowlistUsers, query)

        const response = await manageUsersApiClient.getAllAllowlistUsers(token, query)
        expect(response).toEqual(allowlistUsers)
      })
    })

    describe('update allowlist user access', () => {
      it('should return 200', async () => {
        const id = '611154f6-d360-4e1f-91bc-354104dcfa08'
        const request: UserAllowlistPatchRequest = {
          reason: 'Testing a bug in preprod',
          accessPeriod: 'SIX_MONTHS',
        }
        mockApi('patch', `/users/allowlist/${id}`, successResponse, { status: successResponse })

        const response = await manageUsersApiClient.updateAllowlistUserAccess(token, id, request)
        expect(response.status).toEqual(successResponse)
      })
    })

    describe('get allowlist user', () => {
      it('should return allow list user', async () => {
        const username = 'TUSER_GEN'
        const allowlistUser: UserAllowlistDetail = {
          id: '611154f6-d360-4e1f-91bc-354104dcfa08',
          username,
          email: 'test.user@justice.gov.uk',
          firstName: 'Test',
          lastName: 'User',
          reason: 'For testing purposes',
          createdOn: '04/08/2025T15:53:38.506',
          allowlistEndDate: '04/08/2026',
          lastUpdated: '04/08/2025T15:53:38.506',
          lastUpdatedBy: 'TUSER_ADM',
          userType: 'DIGITAL',
        }
        mockApi('get', `/users/allowlist/${username}`, successResponse, allowlistUser)

        const response = await manageUsersApiClient.getAllowlistUser(token, username)
        expect(response).toEqual(allowlistUser)
      })
    })

    describe('current user', () => {
      it('should return user details from endpoint', async () => {
        const currentUser: User = { username: 'test', authSource: 'nomis' }
        mockApi('get', '/users/me', successResponse, currentUser)

        const response = await manageUsersApiClient.currentUser(token)
        expect(response).toEqual(currentUser)
      })
    })

    describe('current roles', () => {
      it('should return user roles from endpoint', async () => {
        const currentRoles: ExternalUserRole[] = [{ roleCode: 'ROLE_TEST' }, { roleCode: 'ROLE_ADMIN_TEST' }]
        mockApi('get', '/users/me/roles', successResponse, currentRoles)

        const response = await manageUsersApiClient.currentRoles(token)
        expect(response).toEqual(currentRoles)
      })
    })

    describe('get user email', () => {
      it('should return user email', async () => {
        const username = 'TUSER_GEN'
        const emailAddress: EmailAddress = {
          username,
          email: 'test.user@justice.gov.uk',
          verified: false,
        }
        mockApi('get', `/users/${username}/email`, successResponse, emailAddress, { unverified: true })

        const response = await manageUsersApiClient.getUserEmail(token, username)
        expect(response).toEqual(emailAddress)
      })
      it('should return an empty email when the API response contains null', async () => {
        const username = 'TUSER_GEN'
        const emailAddress: EmailAddress = {
          username,
          email: null,
          verified: false,
        }
        mockApi('get', `/users/${username}/email`, successResponse, emailAddress, { unverified: true })

        const response = await manageUsersApiClient.getUserEmail(token, username)
        expect(response).toEqual({ ...emailAddress, email: '' })
      })
      it('should return an empty email address if response is 404', async () => {
        const username = 'TUSER_GEN'
        mockApi('get', `/users/${username}/email`, 404, { message: 'some not found message' }, { unverified: true })

        const response = await manageUsersApiClient.getUserEmail(token, username)
        expect(response).toEqual({ username, email: '', verified: false })
      })
      it('should throw error if error response is not 404', async () => {
        const username = 'TUSER_GEN'
        // Need to mock three requests due to the RestClient retrying
        mockApi('get', `/users/${username}/email`, 500, undefined, { unverified: true })
        mockApi('get', `/users/${username}/email`, 500, undefined, { unverified: true })
        mockApi('get', `/users/${username}/email`, 500, undefined, { unverified: true })

        await expect(manageUsersApiClient.getUserEmail(token, username)).rejects.toThrow('Internal Server Error')
      })
    })
  })
})
