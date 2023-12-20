/**
 * Wrapper functions to set commonly used fields on an 'context' object that is managed over the scope of a request.
 * Hopefully reduces the liklihood of mis-typing property names.
 * Note that by convention the controller(s) and Middleware use the res.locals property as the request scoped context.
 * From controllers down to clients, client interceptors etc the context object is called 'context'.
 */
import { Context } from './interfaces/context'

const setTokens = (
  {
    access_token, // eslint-disable-line camelcase
    refresh_token, // eslint-disable-line camelcase
    authSource,
  }: {
    access_token: string // eslint-disable-line camelcase
    refresh_token: string // eslint-disable-line camelcase
    authSource: string
  },
  context: Context,
): void => {
  // eslint-disable-next-line camelcase
  context.access_token = access_token
  // eslint-disable-next-line camelcase
  context.refresh_token = refresh_token
  // eslint-disable-next-line camelcase
  context.authSource = authSource
}

const hasTokens = (context: Context): boolean => Boolean(context && context.access_token && context.refresh_token)

const getAccessToken = (context: Context): string | null =>
  context && context.access_token ? context.access_token : null

const getRefreshToken = (context: Context): string | null =>
  context && context.refresh_token ? context.refresh_token : null

const normalizeHeaderNames = (srcHeaders: Record<string, string>): Record<string, string> =>
  Object.keys(srcHeaders).reduce(
    (previous, headerName) => ({
      ...previous,
      [headerName.toLowerCase()]: srcHeaders[headerName],
    }),
    {},
  )

const copyNamedHeaders = (headerNames: string[], srcHeaders: Record<string, string>): Record<string, string> =>
  headerNames.reduce((previous, name) => {
    if (srcHeaders[name]) {
      return {
        ...previous,
        [name]: srcHeaders[name],
      }
    }
    return previous
  }, {})
const setRequestPagination = (
  context: Context,
  {
    offset,
    size,
  }: {
    offset?: string
    size?: string
  },
): void => {
  if (offset || size) context.requestHeaders = { 'page-offset': offset || '0', 'page-limit': size || '0' }
}

const getRequestPagination = (context: Context): Record<string, string> => context.requestHeaders || {}

const setResponsePagination = (context: Context, headers: Record<string, string>): void => {
  const headerNames = ['page-offset', 'page-limit', 'total-records']

  const {
    'total-records': totalElements,
    'page-offset': offset,
    'page-limit': limit,
  } = copyNamedHeaders(headerNames, (headers && normalizeHeaderNames(headers)) || {})
  context.offsetPageable = {
    totalElements: totalElements ? parseInt(totalElements, 10) : undefined,
    offset: offset ? parseInt(offset, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  }
}

const getResponsePagination = (context: Context): Record<string, number | undefined> => context.offsetPageable || {}

const setPageable = (
  context: Context,
  {
    totalElements = 0,
    pageable: { pageNumber = 0, pageSize = 20 },
  }: {
    totalElements?: number
    pageable: {
      pageNumber?: number
      pageSize?: number
    }
  },
): void => {
  context.pageable = { totalElements, page: pageNumber, size: pageSize }
}

const getPageable = (
  context: Context,
): {
  totalElements: number
  page: number
  size: number
} => context.pageable

export {
  setTokens,
  hasTokens,
  getAccessToken,
  getRefreshToken,
  setRequestPagination,
  getRequestPagination,
  setResponsePagination,
  getResponsePagination,
  setPageable,
  getPageable,
}
