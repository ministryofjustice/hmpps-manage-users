import contextProperties from '../contextProperties'

export const getHeaders = (
  context: RequestContext,
  resultsLimit: number | undefined = undefined,
): Record<string, string> => {
  const paginationHeaders = contextProperties.getRequestPagination(context)
  const accessToken = contextProperties.getAccessToken(context)

  return {
    ...paginationHeaders,
    ...(resultsLimit && { 'page-limit': resultsLimit.toString() }),
    ...(accessToken && { authorization: `Bearer ${accessToken}` }),
  }
}

export interface RequestContext {
  requestHeaders?: { 'page-offset': number; 'page-limit': number }
  // eslint-disable-next-line camelcase
  access_token?: string
  authSource?: string
}
