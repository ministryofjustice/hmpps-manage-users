import { Context } from '../interfaces/context'
import * as contextProperties from '../contextProperties'

export const getHeaders = (context: Context, resultsLimit?: number) => {
  const paginationHeaders = contextProperties.getRequestPagination(context)
  const accessToken = contextProperties.getAccessToken(context)

  return {
    ...paginationHeaders,
    ...(resultsLimit && { 'page-limit': resultsLimit }),
    ...(accessToken && { authorization: `Bearer ${accessToken}` }),
  }
}

export default getHeaders
