import { ManageUsersEvent } from '../audit/manageUsersEvent'

// eslint-disable-next-line import/prefer-default-export, @typescript-eslint/no-explicit-any
export const auditAction = (action: ManageUsersEvent): any => expect.objectContaining({ action })
