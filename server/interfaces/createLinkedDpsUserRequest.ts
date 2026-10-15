export interface CreateLinkedDpsUserRequest {
  userType: string
  existingUsername: string
  username: string
  email: string
  firstName: string
  lastName: string
  searchUser: string
  createUser: string
  defaultCaseloadId: string
}
