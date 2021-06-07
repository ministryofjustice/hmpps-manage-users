/**
 * Wrapper functions to set commonly used fields on an 'context' object that is managed over the scope of a request.
 * Hopefully reduces the liklihood of mis-typing property names.
 * Note that by convention the controller(s) and Middleware use the res.locals property as the request scoped context.
 * From controllers down to clients, client interceptors etc the context object is called 'context'.
 */

// eslint-disable-next-line camelcase
const setTokens = ({ access_token, refresh_token, authSource }, context) => {
  // eslint-disable-next-line camelcase
  context.access_token = access_token
  // eslint-disable-next-line camelcase
  context.refresh_token = refresh_token
  context.authSource = authSource
}

const hasTokens = (context) => Boolean(context && context.access_token && context.refresh_token)

const getAccessToken = (context) => (context && context.access_token ? context.access_token : null)

const getRefreshToken = (context) => (context && context.refresh_token ? context.refresh_token : null)

const normalizeHeaderNames = (srcHeaders) =>
  Object.keys(srcHeaders).reduce(
    (previous, headerName) => ({
      ...previous,
      [headerName.toLowerCase()]: srcHeaders[headerName],
    }),
    {},
  )

const copyNamedHeaders = (headerNames, srcHeaders) =>
  headerNames.reduce((previous, name) => {
    if (srcHeaders[name]) {
      return {
        ...previous,
        [name]: srcHeaders[name],
      }
    }
    return previous
  }, {})

const setRequestPagination = (context, { offset, size }) => {
  if (offset || size) context.requestHeaders = { 'page-offset': offset || 0, 'page-limit': size || 0 }
}
const getRequestPagination = (context) => context.requestHeaders || {}

const setResponsePagination = (context, headers) => {
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

const getResponsePagination = (context) => context.offsetPageable || {}

const setPageable = (context, { totalElements = 0, pageable: { pageNumber = 0, pageSize = 20 } }) => {
  context.pageable = { totalElements, page: pageNumber, size: pageSize }
}
const getPageable = (context) => context.pageable

module.exports = {
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
