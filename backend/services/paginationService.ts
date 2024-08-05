const maxNumberOfPageLinks = 10
const pageBreakPoint = maxNumberOfPageLinks / 2
const DEFAULT_PAGE_SIZE = 10
/*
The pagination service only shows ten page links regardless of where the current page is pointed.

  Rules:
1) Show ten page links
2) Show pages 5 before and after the current page
3) Where there are less than 5 pages before the current page show the remaining
4) Where there are more than 5 pages after the current page show the remaining
*/

const calculateNextUrl = (currentPage: number, numberOfPages: number, url: URL): string => {
  const newPage = currentPage === numberOfPages - 1 ? currentPage : currentPage + 1
  url.searchParams.set('page', newPage.toString())
  return url.href
}

const calculatePreviousUrl = (currentPage: number, url: URL): string => {
  const newPage = currentPage > 0 ? currentPage - 1 : 0
  url.searchParams.set('page', newPage.toString())
  return url.href
}

export interface PaginationRequest {
  totalElements?: number
  page?: number
  size?: number
}

export interface PageNumberNode {
  text: number
  href: string
  selected: boolean
}

export interface PaginationRange {
  from: number
  to: number | boolean
  count: number
}

export interface PaginationResult {
  items: PageNumberNode[]
  previous?: { text: string; href: string }
  next?: { text: string; href: string }
  results: PaginationRange
  classes: string
}

const getPagination = (pagination: PaginationRequest, url: URL): PaginationResult => {
  const totalResults = pagination.totalElements || 0
  const currentPage = pagination.page || 0
  const limit = pagination.size || DEFAULT_PAGE_SIZE

  const toPageNumberNode = (requestedPage: number): PageNumberNode => {
    url.searchParams.set('page', requestedPage.toString())

    return {
      text: requestedPage + 1,
      href: url.href,
      selected: requestedPage === currentPage,
    }
  }

  const useLowestNumber = (left: number, right: number): number => (left >= right ? right : left)

  const calculateFrom = (numberOfPages: number): number => {
    if (numberOfPages <= maxNumberOfPageLinks) return 0

    const towardsTheEnd = numberOfPages - currentPage <= pageBreakPoint

    if (towardsTheEnd) return numberOfPages - maxNumberOfPageLinks

    return currentPage <= pageBreakPoint ? 0 : currentPage - pageBreakPoint
  }

  const numberOfPages = Math.ceil(totalResults / limit)

  const allPages = numberOfPages > 0 && [...Array(numberOfPages).keys()]
  const from = calculateFrom(numberOfPages)
  const to =
    numberOfPages <= maxNumberOfPageLinks
      ? numberOfPages
      : useLowestNumber(from + maxNumberOfPageLinks, allPages.length)

  const pageList = (numberOfPages > 1 && allPages.slice(from, to)) || []

  const previousPage =
    numberOfPages > 1
      ? {
          text: 'Previous',
          href: calculatePreviousUrl(currentPage, url),
        }
      : undefined
  const nextPage =
    numberOfPages > 1
      ? {
          text: 'Next',
          href: calculateNextUrl(currentPage, numberOfPages, url),
        }
      : undefined

  return {
    items: pageList.map(toPageNumberNode),
    previous: previousPage,
    next: nextPage,
    results: {
      from: currentPage * limit + 1,
      to: numberOfPages > 1 && currentPage + 1 < numberOfPages ? (currentPage + 1) * limit : totalResults,
      count: totalResults,
    },
    classes: 'govuk-!-font-size-19',
  }
}

const paginationService = {
  getPagination,
}

export default paginationService
