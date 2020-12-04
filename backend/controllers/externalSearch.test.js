const { externalSearchFactory } = require('./externalSearch')

describe('external search factory', () => {
  const paginationService = { getPagination: jest.fn() }
  const getAssignableGroupsApi = jest.fn()
  const getSearchableRolesApi = jest.fn()
  const searchApi = jest.fn()
  const logError = jest.fn()
  const externalSearch = externalSearchFactory(
    paginationService,
    getAssignableGroupsApi,
    getSearchableRolesApi,
    searchApi,
    '/search-external-users',
    '/manage-external-users',
    'Maintain external users',
    logError
  )

  describe('index', () => {
    it('should call search user render', async () => {
      const req = { params: {}, flash: jest.fn() }
      getAssignableGroupsApi.mockResolvedValue([{ groupName: 'name', groupCode: 'code' }])
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'name', roleCode: 'code' }])

      const render = jest.fn()
      await externalSearch.index(req, { render })
      expect(render).toBeCalledWith('search.njk', {
        searchTitle: 'Maintain external users',
        searchUrl: '/search-external-users',
        groupDropdownValues: [{ text: 'name', value: 'code' }],
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        errors: undefined,
      })
    })
  })

  describe('results', () => {
    it('should call external search results render', async () => {
      const req = {
        query: { user: 'joe' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
      }
      const pagination = { page: 5 }
      paginationService.getPagination.mockReturnValue(pagination)
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
        locals: { pageable: { page: 5, size: 10, totalElements: 123 } },
      })

      expect(render).toBeCalledWith('externalSearchResults.njk', {
        searchTitle: 'Maintain external users',
        searchUrl: '/search-external-users',
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
        pagination,
      })
    })

    it('should call external search api', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
      }
      const pagination = { page: 5 }
      paginationService.getPagination.mockReturnValue(pagination)
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
      const locals = { pageable: { page: 5, size: 10, totalElements: 123 } }
      await externalSearch.results(req, {
        render,
        locals,
      })

      expect(searchApi).toBeCalledWith(locals, 'joe', '', '', 0, 20)
    })

    it('should call external search api with page and size', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', page: 3, size: 13 },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
      }
      const pagination = { page: 5 }
      paginationService.getPagination.mockReturnValue(pagination)
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
      const locals = { pageable: { page: 5, size: 10, totalElements: 123 } }
      await externalSearch.results(req, {
        render,
        locals,
      })

      expect(searchApi).toBeCalledWith(locals, 'joe', '', '', 3, 13)
    })

    it('should call getPagination with total elements, page, size and url', async () => {
      const req = {
        query: { user: 'joe', page: 3, size: 13 },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
      }
      const pagination = { page: 5 }
      paginationService.getPagination.mockReturnValue(pagination)
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
      const locals = { pageable: { page: 5, size: 10, totalElements: 123 } }
      await externalSearch.results(req, {
        render,
        locals,
      })

      expect(paginationService.getPagination).toBeCalledWith(locals.pageable, new URL('http://localhost/'))
    })
  })
})
