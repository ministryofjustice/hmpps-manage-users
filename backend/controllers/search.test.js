const { searchFactory } = require('./search')

describe('search factory', () => {
  const paginationService = { getPagination: jest.fn() }
  const getSearchableRolesApi = jest.fn()
  const searchApi = jest.fn()
  const logError = jest.fn()
  const pagingApi = jest.fn()

  beforeEach(() => {
    paginationService.getPagination.mockReset()
    getSearchableRolesApi.mockReset()
    searchApi.mockReset()
    logError.mockReset()
    pagingApi.mockReset()
  })

  const mockSearchCall = () => {
    searchApi.mockResolvedValue([
      {
        username: 'BOB',
        firstName: 'Billy',
        lastName: 'Bob',
        email: 'bob@digital.justice.gov.uk',
        enabled: true,
        verified: true,
      },
      {
        username: 'FRED@DIGITAL.JUSTICE.GOV.UK',
        firstName: 'Billy',
        lastName: 'Fred',
        email: 'fred@digital.justice.gov.uk',
        enabled: true,
        verified: true,
      },
      {
        username: 'noemail',
        firstName: 'No',
        lastName: 'Email',
        enabled: true,
        verified: true,
      },
      {
        username: 'blankemail',
        firstName: 'Blank',
        lastName: 'Email',
        email: '',
        enabled: true,
        verified: true,
      },
    ])
  }

  describe('DPS', () => {
    const search = searchFactory(
      paginationService,
      undefined,
      getSearchableRolesApi,
      searchApi,
      pagingApi,
      '/search-dps-users',
      '/manage-dps-users',
      'Search for a DPS user',
      logError
    )

    it('should call search user render', async () => {
      const req = { params: {}, flash: jest.fn() }
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'name', roleCode: 'code' }])

      const render = jest.fn()
      await search.index(req, { render })
      expect(render).toBeCalledWith('search.njk', {
        searchTitle: 'Search for a DPS user',
        searchUrl: '/search-dps-users',
        groupDropdownValues: [],
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        errors: undefined,
        dpsSearch: true,
      })
    })
    it('should call DPS search results render', async () => {
      const req = {
        query: { user: 'joe' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session: {},
      }
      const pagination = { offset: 5 }
      paginationService.getPagination.mockReturnValue(pagination)
      mockSearchCall()
      const render = jest.fn()
      await search.results(req, {
        render,
        locals: { pageable: { offset: 20, size: 10, totalElements: 123 } },
      })

      expect(render).toBeCalledWith('dpsSearchResults.njk', {
        searchTitle: 'Search for a DPS user',
        searchUrl: '/search-dps-users',
        maintainUrl: '/manage-dps-users',
        results: [
          {
            firstName: 'Billy',
            lastName: 'Bob',
            username: 'BOB',
            usernameAndEmail: 'BOB / bob@digital.justice.gov.uk',
            email: 'bob@digital.justice.gov.uk',
            enabled: true,
            verified: true,
          },
          {
            firstName: 'Billy',
            lastName: 'Fred',
            username: 'FRED@DIGITAL.JUSTICE.GOV.UK',
            usernameAndEmail: 'fred@digital.justice.gov.uk',
            email: 'fred@digital.justice.gov.uk',
            enabled: true,
            verified: true,
          },
          {
            firstName: 'No',
            lastName: 'Email',
            username: 'noemail',
            usernameAndEmail: 'noemail',
            enabled: true,
            verified: true,
          },
          {
            firstName: 'Blank',
            lastName: 'Email',
            username: 'blankemail',
            usernameAndEmail: 'blankemail',
            email: '',
            enabled: true,
            verified: true,
          },
        ],
        errors: undefined,
        pagination,
      })
    })
  })

  describe('External', () => {
    const getAssignableGroupsApi = jest.fn()
    const search = searchFactory(
      paginationService,
      getAssignableGroupsApi,
      getSearchableRolesApi,
      searchApi,
      pagingApi,
      '/search-external-users',
      '/manage-external-users',
      'Search for an external user',
      logError
    )

    beforeEach(() => {
      getAssignableGroupsApi.mockReset()
    })

    it('should call search user render', async () => {
      const req = { params: {}, flash: jest.fn() }
      getAssignableGroupsApi.mockResolvedValue([{ groupName: 'name', groupCode: 'code' }])
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'name', roleCode: 'code' }])

      const render = jest.fn()
      await search.index(req, { render })
      expect(render).toBeCalledWith('search.njk', {
        searchTitle: 'Search for an external user',
        searchUrl: '/search-external-users',
        groupDropdownValues: [{ text: 'name', value: 'code' }],
        roleDropdownValues: [{ text: 'name', value: 'code' }],
        errors: undefined,
        dpsSearch: false,
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
          session: {},
        }
        const pagination = { page: 5 }
        paginationService.getPagination.mockReturnValue(pagination)
        mockSearchCall()
        const render = jest.fn()
        await search.results(req, {
          render,
          locals: { pageable: { page: 5, size: 10, totalElements: 123 } },
        })

        expect(render).toBeCalledWith('externalSearchResults.njk', {
          searchTitle: 'Search for an external user',
          searchUrl: '/search-external-users',
          maintainUrl: '/manage-external-users',
          results: [
            {
              firstName: 'Billy',
              lastName: 'Bob',
              username: 'BOB',
              email: 'bob@digital.justice.gov.uk',
              usernameAndEmail: 'BOB / bob@digital.justice.gov.uk',
              enabled: true,
              verified: true,
            },
            {
              firstName: 'Billy',
              lastName: 'Fred',
              username: 'FRED@DIGITAL.JUSTICE.GOV.UK',
              usernameAndEmail: 'fred@digital.justice.gov.uk',
              email: 'fred@digital.justice.gov.uk',
              enabled: true,
              verified: true,
            },
            {
              enabled: true,
              firstName: 'No',
              lastName: 'Email',
              username: 'noemail',
              usernameAndEmail: 'noemail',
              verified: true,
            },
            {
              email: '',
              enabled: true,
              firstName: 'Blank',
              lastName: 'Email',
              username: 'blankemail',
              usernameAndEmail: 'blankemail',
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
          session: {},
        }
        const pagination = { page: 5 }
        paginationService.getPagination.mockReturnValue(pagination)
        mockSearchCall()
        const render = jest.fn()
        const locals = { pageable: { page: 5, size: 10, totalElements: 123 } }
        await search.results(req, {
          render,
          locals,
        })

        expect(searchApi).toBeCalledWith(locals, 'joe', '', '', 0, 20, 0)
      })

      it('should call external search api with page and size', async () => {
        const req = {
          query: { user: 'joe', groupCode: '', roleCode: '', page: 3, size: 13 },
          flash: jest.fn(),
          get: jest.fn().mockReturnValue('localhost'),
          protocol: 'http',
          originalUrl: '/',
          session: {},
        }
        const pagination = { page: 5 }
        paginationService.getPagination.mockReturnValue(pagination)
        mockSearchCall()
        const render = jest.fn()
        const locals = { pageable: { page: 5, size: 10, totalElements: 123 } }
        await search.results(req, {
          render,
          locals,
        })

        expect(searchApi).toBeCalledWith(locals, 'joe', '', '', 3, 13, 0)
      })

      it('should call getPagination with total elements, page, size and url', async () => {
        const req = {
          query: { user: 'joe', page: 3, size: 13 },
          flash: jest.fn(),
          get: jest.fn().mockReturnValue('localhost'),
          protocol: 'http',
          originalUrl: '/',
          session: {},
        }
        const pagination = { page: 5 }
        paginationService.getPagination.mockReturnValue(pagination)
        mockSearchCall()
        const render = jest.fn()
        const pageable = { page: 5, size: 10, totalElements: 123 }
        pagingApi.mockReturnValue(pageable)
        await search.results(req, { render })

        expect(paginationService.getPagination).toBeCalledWith(pageable, new URL('http://localhost/'))
      })

      it('should stash away the search url in the session', async () => {
        const req = {
          query: { user: 'joe', page: 3, size: 13 },
          flash: jest.fn(),
          get: jest.fn().mockReturnValue('localhost'),
          protocol: 'http',
          originalUrl: '/some-url',
          session: {},
        }
        const pagination = { page: 5 }
        paginationService.getPagination.mockReturnValue(pagination)
        mockSearchCall()
        const render = jest.fn()
        const pageable = { page: 5, size: 10, totalElements: 123 }
        pagingApi.mockReturnValue(pageable)
        await search.results(req, { render })

        expect(req.session).toEqual({ searchResultsUrl: '/some-url' })
      })
    })
  })
})
