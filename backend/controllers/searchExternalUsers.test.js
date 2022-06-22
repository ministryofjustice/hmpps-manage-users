const { searchFactory } = require('./searchExternalUsers')

const results = [
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
]
const users = results.map(({ usernameAndEmail, ...rest }) => rest)

describe('search factory', () => {
  const paginationService = { getPagination: jest.fn() }
  const getSearchableRolesApi = jest.fn()
  const searchApi = jest.fn()
  const pagingApi = jest.fn()
  const allowDownload = jest.fn()
  const getAssignableGroupsApi = jest.fn()
  const mockSearchCall = () => {
    searchApi.mockResolvedValue(users)
  }

  const search = searchFactory(
    paginationService,
    getAssignableGroupsApi,
    getSearchableRolesApi,
    searchApi,
    pagingApi,
    '/search-external-users',
    '/manage-external-users',
    'Search for an external user',
    allowDownload,
  )

  beforeEach(() => {
    paginationService.getPagination.mockReset()
    getSearchableRolesApi.mockReset()
    searchApi.mockReset()
    pagingApi.mockReset()
    allowDownload.mockReset()
    getAssignableGroupsApi.mockReset()
  })

  it('should call search user render', async () => {
    const req = { params: {}, flash: jest.fn() }
    getAssignableGroupsApi.mockResolvedValue([{ text: 'name', value: 'code' }])
    getSearchableRolesApi.mockResolvedValue([{ roleName: 'name', roleCode: 'code' }])

    const render = jest.fn()
    await search.index(req, { render })
    expect(render).toBeCalledWith('searchExternalUsers.njk', {
      searchTitle: 'Search for an external user',
      searchUrl: '/search-external-users',
      groupDropdownValues: [{ text: 'name', value: 'code' }],
      roleDropdownValues: [{ text: 'name', value: 'code' }],
    })
  })

  describe('results', () => {
    it('should call external search results render', async () => {
      const req = {
        query: { user: 'joe' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/results',
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
        results,
        errors: undefined,
        pagination,
        groupCode: undefined,
        roleCode: undefined,
        username: 'joe',
        status: undefined,
        downloadUrl: undefined,
      })
    })

    it('should call external search api', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
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

      expect(searchApi).toBeCalledWith({
        locals,
        user: 'joe',
        roleCode: '',
        groupCode: '',
        status: 'ACTIVE',
        pageNumber: 0,
        pageSize: 20,
        pageOffset: 0,
      })
    })

    it('should call external search api with page and size', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'INACTIVE', page: 3, size: 13 },
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

      expect(searchApi).toBeCalledWith({
        locals,
        user: 'joe',
        roleCode: '',
        groupCode: '',
        status: 'INACTIVE',
        pageNumber: 3,
        pageSize: 13,
        pageOffset: 0,
      })
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

    it('should pass downloadUrl if user has correct permission', async () => {
      const req = {
        query: { user: 'joe', page: 3, size: 13 },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/results',
        session: {},
      }
      const pagination = { page: 5 }
      paginationService.getPagination.mockReturnValue(pagination)
      mockSearchCall()
      allowDownload.mockReturnValue(true)
      const render = jest.fn()
      const pageable = { page: 5, size: 10, totalElements: 123 }
      pagingApi.mockReturnValue(pageable)
      await search.results(req, { render })

      expect(render.mock.calls[0][1].downloadUrl).toBeInstanceOf(URL)
      expect(render.mock.calls[0][1].downloadUrl.toString()).toEqual('http://localhost/download')
    })
  })
})
