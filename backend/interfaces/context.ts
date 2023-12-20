export interface Context {
  access_token?: string
  refresh_token?: string
  authSource?: string
  requestHeaders?: {
    'page-offset'?: string
    'page-limit'?: string
  }
  offsetPageable?: {
    totalElements?: number
    offset?: number
    limit?: number
  }
  pageable?: {
    totalElements: number
    page: number
    size: number
  }
}
