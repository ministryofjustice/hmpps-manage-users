import { ManageUsersApiClient } from './manageUsersApiClient'

export type RestClientBuilder<T> = (token: string) => T

export const manageUsersApiBuilder: RestClientBuilder<ManageUsersApiClient> = (token: string) =>
  new ManageUsersApiClient(token)

export { ManageUsersApiClient }
