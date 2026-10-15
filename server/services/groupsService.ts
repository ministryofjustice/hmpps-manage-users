import { ChildGroup, CreateGroupRequest, Group, UpdateGroupNameRequest, UserGroup } from 'manageUsersApiClient'
import { Response } from 'superagent'
import ManageUsersApiClient from '../data/manageUsersApiClient'

export default class GroupsService {
  constructor(private readonly manageUsersApiClient: ManageUsersApiClient) {}

  createGroup = async (token: string, request: CreateGroupRequest): Promise<Response> =>
    this.manageUsersApiClient.createGroup(token, request)

  groupDetails = async (token: string, group: string): Promise<Group> =>
    this.manageUsersApiClient.groupDetails(token, group)

  changeGroupName = async (token: string, group: string, groupName: UpdateGroupNameRequest): Promise<Response> =>
    this.manageUsersApiClient.changeGroupName(token, group, groupName)

  deleteGroup = async (token: string, group: string): Promise<Response> =>
    this.manageUsersApiClient.deleteGroup(token, group)

  createChildGroup = async (token: string, parentGroupCode: string, request: CreateGroupRequest): Promise<Response> =>
    this.manageUsersApiClient.createChildGroup(token, { ...request, parentGroupCode })

  childGroupDetails = async (token: string, group: string): Promise<ChildGroup> =>
    this.manageUsersApiClient.childGroupDetails(token, group)

  changeChildGroupName = async (token: string, group: string, groupName: UpdateGroupNameRequest): Promise<Response> =>
    this.manageUsersApiClient.changeChildGroupName(token, group, groupName)

  deleteChildGroup = async (token: string, group: string): Promise<Response> =>
    this.manageUsersApiClient.deleteChildGroup(token, group)

  getAllCRSGroups = async (token: string): Promise<UserGroup[]> => this.manageUsersApiClient.getAllCRSGroups(token)
}
