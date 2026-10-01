export interface BulkUserRoleAdditionsJobIdParam {
  id: string
}

export interface UploadedUsersFile {
  filename: string
  // Stored as a base64 string rather than a Buffer: session stores (e.g. express-session's
  // MemoryStore, Redis) JSON serialise session data, which turns a Buffer into a plain
  // { type: 'Buffer', data: number[] } object on deserialisation - breaking any code that
  // expects a real Buffer once the session has been persisted and reloaded.
  data: string
}

export interface BulkUserRolesRequestSession {
  jiraReference?: string
  roles?: string[]
  totalNumberOfUsers?: number
  usersFile?: UploadedUsersFile
}

export interface BulkUserRolesSummary {
  requestedBy: string
  jiraReference: string
  roles: string[]
  uploadFile: string
  totalNumberOfUsers: number
  totalAssignments: number
}
