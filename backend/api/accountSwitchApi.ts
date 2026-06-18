import { OAuthEnabledClient } from './oauthEnabledClient'
import { Context } from '../interfaces/context'

export interface LinkedAccount {
  systemName: string
  username: string
  authSource: string
}

export interface AccountSwitchTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  auth_source: string
  user_name: string
}

export interface AccountSwitchApi {
  getLinkedAccounts: (context: Context) => Promise<LinkedAccount[]>
  switchAccount: (context: Context, targetAccount: string) => Promise<AccountSwitchTokenResponse>
}

export const accountSwitchApiFactory = (client: OAuthEnabledClient): AccountSwitchApi => {
  const getLinkedAccounts = async (context: Context): Promise<LinkedAccount[]> => {
    const response = await client.get(context, '/api/account/linked')
    return response.body as LinkedAccount[]
  }

  const switchAccount = async (context: Context, targetAccount: string): Promise<AccountSwitchTokenResponse> => {
    const response = await client.post(context, '/api/account/switch', { targetAccount })
    return response.body as AccountSwitchTokenResponse
  }

  return { getLinkedAccounts, switchAccount }
}
