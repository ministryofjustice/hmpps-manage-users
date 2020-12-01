const { externalSearchFactory } = require('./externalSearch')

describe('external search factory', () => {
  const searchApi = jest.fn()
  const logError = jest.fn()
  const externalSearch = externalSearchFactory(
    searchApi,
    '/maintain-external-users',
    '/manage-external-users',
    'Maintain external users',
    logError
  )

  it('should call external search results render', async () => {
    const req = { query: { user: 'joe' }, flash: jest.fn() }
    searchApi.mockResolvedValue([
      {
        username: 'BOB',
        firstName: 'Billy',
        lastName: 'Bob',
        email: 'bob@digital.justice.gov.uk',
        enabled: true,
        verified: true,
      },
    ])
    const render = jest.fn()
    await externalSearch.results(req, {
      render,
      locals: { responseHeaders: { 'page-offset': 5, 'page-limit': 10, 'total-records': 123 } },
    })

    expect(render).toBeCalledWith('externalSearchResults.njk', {
      searchTitle: 'Maintain external users',
      searchUrl: '/maintain-external-users',
      maintainUrl: '/manage-external-users',
      results: [
        {
          firstName: 'Billy',
          lastName: 'Bob',
          username: 'BOB',
          email: 'bob@digital.justice.gov.uk',
          enabled: true,
          verified: true,
        },
      ],
      errors: undefined,
      'page-offset': 5,
      'page-limit': 10,
      'total-records': 123,
    })
  })
})
