import { OAuthEnabledClient } from '../api/oauthEnabledClient'

/* eslint-disable no-param-reassign */
export const mockResolvedValue = (client: OAuthEnabledClient, response: unknown): unknown => {
  client.get = jest.fn().mockReturnValue({
    then: () => response,
  })
  client.post = jest.fn().mockReturnValue({
    then: () => response,
  })
  client.put = jest.fn().mockReturnValue({
    then: () => response,
  })
  client.del = jest.fn().mockReturnValue({
    then: () => response,
  })
  return response
}

export const mockRejectedValue = (client: OAuthEnabledClient, error: Error): Error => {
  client.get = jest.fn().mockRejectedValue(error)
  client.post = jest.fn().mockRejectedValue(error)
  client.put = jest.fn().mockRejectedValue(error)
  client.del = jest.fn().mockRejectedValue(error)
  return error
}
/* eslint-enable no-param-reassign */
