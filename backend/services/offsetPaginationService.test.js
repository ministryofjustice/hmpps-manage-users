const service = require('./offsetPaginationService')

describe('Offset Pagination Service', () => {
  it('should display one to ten when the page count is above ten', () => {
    const response = service.getPagination({ totalElements: 110, offset: 0, limit: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { text: 1, href: 'http://localhost/?offset=0', selected: true },
        { text: 2, href: 'http://localhost/?offset=10', selected: false },
        { text: 3, href: 'http://localhost/?offset=20', selected: false },
        { text: 4, href: 'http://localhost/?offset=30', selected: false },
        { text: 5, href: 'http://localhost/?offset=40', selected: false },
        { text: 6, href: 'http://localhost/?offset=50', selected: false },
        { text: 7, href: 'http://localhost/?offset=60', selected: false },
        { text: 8, href: 'http://localhost/?offset=70', selected: false },
        { text: 9, href: 'http://localhost/?offset=80', selected: false },
        { text: 10, href: 'http://localhost/?offset=90', selected: false },
      ],
      next: { text: 'Next', href: 'http://localhost/?offset=10' },
      previous: { text: 'Previous', href: 'http://localhost/?offset=0' },
      results: { count: 110, from: 1, to: 10 },
    })
  })

  it('should show 5 pages before the current page and 5 pages inclusive after the current page', () => {
    const response = service.getPagination({ totalElements: 220, offset: 60, limit: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { text: 2, href: 'http://localhost/?offset=10', selected: false },
        { text: 3, href: 'http://localhost/?offset=20', selected: false },
        { text: 4, href: 'http://localhost/?offset=30', selected: false },
        { text: 5, href: 'http://localhost/?offset=40', selected: false },
        { text: 6, href: 'http://localhost/?offset=50', selected: false },
        { text: 7, href: 'http://localhost/?offset=60', selected: true },
        { text: 8, href: 'http://localhost/?offset=70', selected: false },
        { text: 9, href: 'http://localhost/?offset=80', selected: false },
        { text: 10, href: 'http://localhost/?offset=90', selected: false },
        { text: 11, href: 'http://localhost/?offset=100', selected: false },
      ],
      next: { text: 'Next', href: 'http://localhost/?offset=70' },
      previous: { text: 'Previous', href: 'http://localhost/?offset=50' },
      results: { count: 220, from: 61, to: 70 },
    })
  })

  it('should handle being on the last few pages', () => {
    const response = service.getPagination({ totalElements: 200, offset: 90, limit: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?offset=40', selected: false, text: 5 },
        { href: 'http://localhost/?offset=50', selected: false, text: 6 },
        { href: 'http://localhost/?offset=60', selected: false, text: 7 },
        { href: 'http://localhost/?offset=70', selected: false, text: 8 },
        { href: 'http://localhost/?offset=80', selected: false, text: 9 },
        { href: 'http://localhost/?offset=90', selected: true, text: 10 },
        { href: 'http://localhost/?offset=100', selected: false, text: 11 },
        { href: 'http://localhost/?offset=110', selected: false, text: 12 },
        { href: 'http://localhost/?offset=120', selected: false, text: 13 },
        { href: 'http://localhost/?offset=130', selected: false, text: 14 },
      ],
      next: {
        href: 'http://localhost/?offset=100',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?offset=80',
        text: 'Previous',
      },
      results: {
        count: 200,
        from: 91,
        to: 100,
      },
    })
  })

  it('should handle being on the last pages', () => {
    const response = service.getPagination({ totalElements: 200, offset: 210, limit: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?offset=100', selected: false, text: 11 },
        { href: 'http://localhost/?offset=110', selected: false, text: 12 },
        { href: 'http://localhost/?offset=120', selected: false, text: 13 },
        { href: 'http://localhost/?offset=130', selected: false, text: 14 },
        { href: 'http://localhost/?offset=140', selected: false, text: 15 },
        { href: 'http://localhost/?offset=150', selected: false, text: 16 },
        { href: 'http://localhost/?offset=160', selected: false, text: 17 },
        { href: 'http://localhost/?offset=170', selected: false, text: 18 },
        { href: 'http://localhost/?offset=180', selected: false, text: 19 },
        { href: 'http://localhost/?offset=190', selected: false, text: 20 },
      ],
      next: {
        href: 'http://localhost/?offset=210',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?offset=200',
        text: 'Previous',
      },
      results: {
        count: 200,
        from: 211,
        to: 200,
      },
    })
  })

  it('should handle a current page being in the upper middle position', async () => {
    const response = service.getPagination({ totalElements: 274, offset: 220, limit: 20 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?offset=80', selected: false, text: 5 },
        { href: 'http://localhost/?offset=100', selected: false, text: 6 },
        { href: 'http://localhost/?offset=120', selected: false, text: 7 },
        { href: 'http://localhost/?offset=140', selected: false, text: 8 },
        { href: 'http://localhost/?offset=160', selected: false, text: 9 },
        { href: 'http://localhost/?offset=180', selected: false, text: 10 },
        { href: 'http://localhost/?offset=200', selected: false, text: 11 },
        { href: 'http://localhost/?offset=220', selected: true, text: 12 },
        { href: 'http://localhost/?offset=240', selected: false, text: 13 },
        { href: 'http://localhost/?offset=260', selected: false, text: 14 },
      ],
      next: {
        href: 'http://localhost/?offset=240',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?offset=200',
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
    const response = service.getPagination({ totalElements: 70, offset: 0, limit: 10 }, new URL('http://localhost/'))

    expect(response).toEqual({
      classes: 'govuk-!-font-size-19',
      items: [
        { href: 'http://localhost/?offset=0', selected: true, text: 1 },
        { href: 'http://localhost/?offset=10', selected: false, text: 2 },
        { href: 'http://localhost/?offset=20', selected: false, text: 3 },
        { href: 'http://localhost/?offset=30', selected: false, text: 4 },
        { href: 'http://localhost/?offset=40', selected: false, text: 5 },
        { href: 'http://localhost/?offset=50', selected: false, text: 6 },
        { href: 'http://localhost/?offset=60', selected: false, text: 7 },
      ],
      next: {
        href: 'http://localhost/?offset=10',
        text: 'Next',
      },
      previous: {
        href: 'http://localhost/?offset=0',
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
    service.getPagination({ totalElements: undefined, offset: 10, limit: 0 }, new URL('http://localhost/'))
  })
})
