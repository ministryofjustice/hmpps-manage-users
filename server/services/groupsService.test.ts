import { ChildGroup, CreateGroupRequest, Group, UpdateGroupNameRequest, UserGroup } from 'manageUsersApiClient'
import { Response } from 'superagent'
import ManageUsersApiClient from '../data/manageUsersApiClient'
import GroupsService from './groupsService'

jest.mock('../data/manageUsersApiClient')

describe('GroupsService', () => {
  let apiClient: jest.Mocked<ManageUsersApiClient>
  let service: GroupsService

  beforeEach(() => {
    apiClient = {
      createGroup: jest.fn(),
      groupDetails: jest.fn(),
      changeGroupName: jest.fn(),
      deleteGroup: jest.fn(),
      createChildGroup: jest.fn(),
      childGroupDetails: jest.fn(),
      changeChildGroupName: jest.fn(),
      deleteChildGroup: jest.fn(),
      getAllCRSGroups: jest.fn(),
    } as unknown as jest.Mocked<ManageUsersApiClient>

    service = new GroupsService(apiClient)
  })

  const token = 'test-token'

  it('Creates a group', async () => {
    const request: CreateGroupRequest = {
      groupCode: 'TEST_GROUP',
      groupName: 'Test Group',
    }

    const response = {
      ok: true,
    } as Response

    apiClient.createGroup.mockResolvedValue(response)

    const result = await service.createGroup(token, request)

    expect(apiClient.createGroup).toHaveBeenCalledWith(token, request)
    expect(result).toBe(response)
  })

  it('Gets group details', async () => {
    const response: Group = {
      groupCode: 'TEST_GROUP',
      groupName: 'Test Group',
    }

    apiClient.groupDetails.mockResolvedValue(response)

    const result = await service.groupDetails(token, 'TEST_GROUP')

    expect(apiClient.groupDetails).toHaveBeenCalledWith(token, 'TEST_GROUP')
    expect(result).toBe(response)
  })

  it('Changes a group name', async () => {
    const response = {
      ok: true,
    } as Response
    const updatedGroupName = {
      groupName: 'New group',
    } as UpdateGroupNameRequest

    apiClient.changeGroupName.mockResolvedValue(response)

    const result = await service.changeGroupName(token, 'TEST_GROUP', updatedGroupName)

    expect(apiClient.changeGroupName).toHaveBeenCalledWith(token, 'TEST_GROUP', updatedGroupName)
    expect(result).toBe(response)
  })

  it('Deletes a group', async () => {
    const response = {
      ok: true,
    } as Response

    apiClient.deleteGroup.mockResolvedValue(response)

    const result = await service.deleteGroup(token, 'TEST_GROUP')

    expect(apiClient.deleteGroup).toHaveBeenCalledWith(token, 'TEST_GROUP')
    expect(result).toBe(response)
  })

  it('Creates a child group', async () => {
    const request: CreateGroupRequest = {
      groupCode: 'TEST_GROUP',
      groupName: 'Test Group',
    }
    const parentGroupCode = 'TEST_PARENT_GROUP'

    const response = {
      ok: true,
    } as Response

    apiClient.createChildGroup.mockResolvedValue(response)

    const result = await service.createChildGroup(token, parentGroupCode, request)

    expect(apiClient.createChildGroup).toHaveBeenCalledWith(token, { ...request, parentGroupCode })
    expect(result).toBe(response)
  })

  it('Gets child group details', async () => {
    const response: ChildGroup = {
      groupCode: 'TEST_GROUP',
      groupName: 'Test Group',
    }

    apiClient.childGroupDetails.mockResolvedValue(response)

    const result = await service.childGroupDetails(token, 'TEST_GROUP')

    expect(apiClient.childGroupDetails).toHaveBeenCalledWith(token, 'TEST_GROUP')
    expect(result).toBe(response)
  })

  it('Changes a child group name', async () => {
    const response = {
      ok: true,
    } as Response
    const updatedGroupName = {
      groupName: 'New group',
    } as UpdateGroupNameRequest

    apiClient.changeChildGroupName.mockResolvedValue(response)

    const result = await service.changeChildGroupName(token, 'TEST_GROUP', updatedGroupName)

    expect(apiClient.changeChildGroupName).toHaveBeenCalledWith(token, 'TEST_GROUP', updatedGroupName)
    expect(result).toBe(response)
  })

  it('Deletes a child group', async () => {
    const response = {
      ok: true,
    } as Response

    apiClient.deleteChildGroup.mockResolvedValue(response)

    const result = await service.deleteChildGroup(token, 'TEST_GROUP')

    expect(apiClient.deleteChildGroup).toHaveBeenCalledWith(token, 'TEST_GROUP')
    expect(result).toBe(response)
  })

  it('Gets all CRS groups', async () => {
    const response: UserGroup[] = [
      {
        groupCode: 'CRS_GROUP_ONE',
        groupName: 'Test CRS Group One',
      },
      {
        groupCode: 'CRS_GROUP_TWO',
        groupName: 'Test CRS Group Two',
      },
    ]

    apiClient.getAllCRSGroups.mockResolvedValue(response)

    const result = await service.getAllCRSGroups(token)

    expect(apiClient.getAllCRSGroups).toHaveBeenCalledWith(token)
    expect(result).toBe(response)
  })
})
