import { SanitisedError } from '@ministryofjustice/hmpps-rest-client'
import { ErrorResponse } from 'manageUsersApiClient'

const emailVerificationError = (error: SanitisedError<ErrorResponse>): string => {
  const { userMessage, developerMessage } = error.data
  if (developerMessage?.includes('failed with reason: domain')) {
    return 'The email domain is not allowed. Enter a work email address'
  }
  if (developerMessage?.includes('failed with reason: duplicate')) {
    return 'This email address is already assigned to a different user'
  }
  return userMessage
}
export default emailVerificationError
