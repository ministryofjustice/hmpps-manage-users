import service from './paginationService'

describe('Pagination service 2', () => {
  it('should display one to ten when the page count is above ten', () => {
    const response = service.getPagination({ totalElements: 110, page: 0, size: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { text: 1, href: 'http://localhost/?page=0', selected: true },
        { text: 2, href: 'http://localhost/?page=1', selected: false },
        { text: 3, href: 'http://localhost/?page=2', selected: false },
        { text: 4, href: 'http://localhost/?page=3', selected: false },
        { text: 5, href: 'http://localhost/?page=4', selected: false },
        { text: 6, href: 'http://localhost/?page=5', selected: false },
        { text: 7, href: 'http://localhost/?page=6', selected: false },
        { text: 8, href: 'http://localhost/?page=7', selected: false },
        { text: 9, href: 'http://localhost/?page=8', selected: false },
        { text: 10, href: 'http://localhost/?page=9', selected: false },
      ],
      next: { text: 'Next', href: 'http://localhost/?page=1' },
      previous: { text: 'Previous', href: 'http://localhost/?page=0' },
      results: { count: 110, from: 1, to: 10 },
    })
  })

  it('should show 5 pages before the current page and 5 pages inclusive after the current page', () => {
    const response = service.getPagination({ totalElements: 220, page: 6, size: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { text: 2, href: 'http://localhost/?page=1', selected: false },
        { text: 3, href: 'http://localhost/?page=2', selected: false },
        { text: 4, href: 'http://localhost/?page=3', selected: false },
        { text: 5, href: 'http://localhost/?page=4', selected: false },
        { text: 6, href: 'http://localhost/?page=5', selected: false },
        { text: 7, href: 'http://localhost/?page=6', selected: true },
        { text: 8, href: 'http://localhost/?page=7', selected: false },
        { text: 9, href: 'http://localhost/?page=8', selected: false },
        { text: 10, href: 'http://localhost/?page=9', selected: false },
        { text: 11, href: 'http://localhost/?page=10', selected: false },
      ],
      next: { text: 'Next', href: 'http://localhost/?page=7' },
      previous: { text: 'Previous', href: 'http://localhost/?page=5' },
      results: { count: 220, from: 61, to: 70 },
    })
  })

  it('should handle being on the last few pages', () => {
    const response = service.getPagination({ totalElements: 200, page: 9, size: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?page=4', selected: false, text: 5 },
        { href: 'http://localhost/?page=5', selected: false, text: 6 },
        { href: 'http://localhost/?page=6', selected: false, text: 7 },
        { href: 'http://localhost/?page=7', selected: false, text: 8 },
        { href: 'http://localhost/?page=8', selected: false, text: 9 },
        { href: 'http://localhost/?page=9', selected: true, text: 10 },
        { href: 'http://localhost/?page=10', selected: false, text: 11 },
        { href: 'http://localhost/?page=11', selected: false, text: 12 },
        { href: 'http://localhost/?page=12', selected: false, text: 13 },
        { href: 'http://localhost/?page=13', selected: false, text: 14 },
      ],
      next: {
        href: 'http://localhost/?page=10',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?page=8',
        text: 'Previous',
      },
      results: {
        count: 200,
        from: 91,
        to: 100,
      },
    })
  })

  it('should handle being on a full last page', () => {
    const response = service.getPagination({ totalElements: 200, page: 19, size: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?page=10', selected: false, text: 11 },
        { href: 'http://localhost/?page=11', selected: false, text: 12 },
        { href: 'http://localhost/?page=12', selected: false, text: 13 },
        { href: 'http://localhost/?page=13', selected: false, text: 14 },
        { href: 'http://localhost/?page=14', selected: false, text: 15 },
        { href: 'http://localhost/?page=15', selected: false, text: 16 },
        { href: 'http://localhost/?page=16', selected: false, text: 17 },
        { href: 'http://localhost/?page=17', selected: false, text: 18 },
        { href: 'http://localhost/?page=18', selected: false, text: 19 },
        { href: 'http://localhost/?page=19', selected: true, text: 20 },
      ],
      next: {
        href: 'http://localhost/?page=19',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?page=18',
        text: 'Previous',
      },
      results: {
        count: 200,
        from: 191,
        to: 200,
      },
    })
  })

  it('should handle being on partially populated last page', () => {
    const response = service.getPagination({ totalElements: 198, page: 19, size: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?page=10', selected: false, text: 11 },
        { href: 'http://localhost/?page=11', selected: false, text: 12 },
        { href: 'http://localhost/?page=12', selected: false, text: 13 },
        { href: 'http://localhost/?page=13', selected: false, text: 14 },
        { href: 'http://localhost/?page=14', selected: false, text: 15 },
        { href: 'http://localhost/?page=15', selected: false, text: 16 },
        { href: 'http://localhost/?page=16', selected: false, text: 17 },
        { href: 'http://localhost/?page=17', selected: false, text: 18 },
        { href: 'http://localhost/?page=18', selected: false, text: 19 },
        { href: 'http://localhost/?page=19', selected: true, text: 20 },
      ],
      next: {
        href: 'http://localhost/?page=19',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?page=18',
        text: 'Previous',
      },
      results: {
        count: 198,
        from: 191,
        to: 198,
      },
    })
  })

  it('should handle a current page being in the upper middle position', async () => {
    const response = service.getPagination({ totalElements: 274, page: 11, size: 20 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?page=4', selected: false, text: 5 },
        { href: 'http://localhost/?page=5', selected: false, text: 6 },
        { href: 'http://localhost/?page=6', selected: false, text: 7 },
        { href: 'http://localhost/?page=7', selected: false, text: 8 },
        { href: 'http://localhost/?page=8', selected: false, text: 9 },
        { href: 'http://localhost/?page=9', selected: false, text: 10 },
        { href: 'http://localhost/?page=10', selected: false, text: 11 },
        { href: 'http://localhost/?page=11', selected: true, text: 12 },
        { href: 'http://localhost/?page=12', selected: false, text: 13 },
        { href: 'http://localhost/?page=13', selected: false, text: 14 },
      ],
      next: {
        href: 'http://localhost/?page=12',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?page=10',
        text: 'Previous',
      },
      results: {
        count: 274,
        from: 221,
        to: 240,
      },
    })
  })

  it('should deal with less than ten pages', async () => {
    const response = service.getPagination({ totalElements: 70, page: 0, size: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?page=0', selected: true, text: 1 },
        { href: 'http://localhost/?page=1', selected: false, text: 2 },
        { href: 'http://localhost/?page=2', selected: false, text: 3 },
        { href: 'http://localhost/?page=3', selected: false, text: 4 },
        { href: 'http://localhost/?page=4', selected: false, text: 5 },
        { href: 'http://localhost/?page=5', selected: false, text: 6 },
        { href: 'http://localhost/?page=6', selected: false, text: 7 },
      ],
      next: {
        href: 'http://localhost/?page=1',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?page=0',
        text: 'Previous',
      },
      results: {
        count: 70,
        from: 1,
        to: 10,
      },
    })
  })

  it('should not throw error when totalResults is undefined', () => {
    service.getPagination({ totalElements: undefined, page: 10, size: 0 }, new URL('http://localhost/'))
  })
})
