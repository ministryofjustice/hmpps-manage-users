import { PagedList } from 'manageUsersApiClient'

export default function createPagedList<T>(content: T[]): PagedList<T> {
  const { length } = content
  return {
    content,
    empty: false,
    first: true,
    last: false,
    number: 0,
    numberOfElements: length,
    pageable: { offset: 0, pageNumber: 0, pageSize: length, paged: false, sort: undefined, unpaged: false },
    size: length,
    sort: { empty: false, sorted: false, unsorted: true },
    totalElements: length,
    totalPages: 1,
  }
}
