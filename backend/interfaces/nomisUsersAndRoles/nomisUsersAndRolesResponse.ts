
interface NomisUserSearchResponse {
    content: NomisUserSearchResponseItem[]
    pageable: Pageable
    totalElements: number
    totalPages: number
    last: boolean
    size: number
    number: number
    sort: Sort
    numberOfElements: number
    first: boolean
    empty: boolean
}

interface NomisUserSearchResponseItem {
    username: string
    staffId: number
    firstName: string
    lastName: string
    active: boolean
    activeCaseload: ActiveCaseload
    dpsRoleCount: number
}

interface ActiveCaseload {
    id: string
    name: string
}

interface Pageable {
    sort: Sort
    offset: number
    pageSize: number
    pageNumber: number
    paged: boolean
    unpaged: boolean
}

interface Sort {
    sorted: boolean
    unsorted: boolean
    empty: boolean
}