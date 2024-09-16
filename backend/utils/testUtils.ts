import { ManageUsersEvent } from '../audit'

// eslint-disable-next-line import/prefer-default-export, @typescript-eslint/no-explicit-any
export const auditAction = (action: ManageUsersEvent): any => expect.objectContaining({ action })
