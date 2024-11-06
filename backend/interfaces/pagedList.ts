// eslint-disable-next-line @typescript-eslint/no-wrapper-object-types, @typescript-eslint/no-empty-object-type
export interface PagedListItem extends Object {}

export interface PagedList<TPagedListItem extends PagedListItem> {
  content: TPagedListItem[]
  pageable?: {
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    pageSize: number
    pageNumber: number
    paged: boolean
    unpaged: boolean
  }
  totalPages: number
  last: boolean
  totalElements: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  first: boolean
  numberOfElements: number
  empty: boolean
}

export interface PagedListQueryParams {
  page?: number
  size?: number
  sort?: string
  showAll?: boolean

  from?: string
  to?: string
  alertStatus?: 'ACTIVE' | 'INACTIVE'
  alertType?: string | string[]

  type?: string
  subType?: string
  startDate?: string
  endDate?: string
}
