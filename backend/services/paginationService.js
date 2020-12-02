const maxNumberOfPageLinks = 10
const pageBreakPoint = maxNumberOfPageLinks / 2

/*

The pagination service only shows ten page links regardless of where the current page is pointed.

Rules:
  1) Show ten page links
  2) Show pages 5 before and after the current page
  3) Where there are less than 5 pages before the current page show the remaining
  4) Where there are more than 5 pages after the current page show the remaining

1 2 3 4 5 6 7 8 9 10
^

1 2 3 4 5 6 7 8 9 10
          ^

2 3 4 5 6 7 8 9 10 11
          ^

4 5 6 7 8 9 10 11 12 13
          ^

2 3 4 5 6 7 8 9 10 11
          ^

4 5 6 7 8 9 10 11 13 14
          ^

4 5 6 7 8 9 10 11 13 14
            ^

4 5 6 7 8 9 10 11 13 14
                ^
 */

const calculateNextUrl = (currentPage, numberOfPages, url) => {
  const newPage = currentPage === numberOfPages - 1 ? currentPage : currentPage + 1
  url.searchParams.set('page', newPage)
  return url.href
}

const calculatePreviousUrl = (currentPage, url) => {
  const newPage = currentPage > 0 ? currentPage - 1 : 0
  url.searchParams.set('page', newPage)
  return url.href
}

const getPagination = ({ totalElements: totalResults, page: currentPage, size: limit }, url) => {
  const toPageNumberNode = (requestedPage) => {
    url.searchParams.set('page', requestedPage)

    return {
      text: requestedPage + 1,
      href: url.href,
      selected: requestedPage === currentPage,
    }
  }

  const useLowestNumber = (left, right) => (left >= right ? right : left)

  const calculateFrom = (numberOfPages) => {
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
      to: numberOfPages > 1 && currentPage < numberOfPages ? (currentPage + 1) * limit : totalResults,
      count: totalResults,
    },
    classes: 'govuk-!-font-size-19',
  }
}

module.exports = {
  getPagination,
}
