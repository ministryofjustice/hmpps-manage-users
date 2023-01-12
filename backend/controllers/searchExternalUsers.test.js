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

const emptyResults = []
const noUsers = emptyResults.map(({ usernameAndEmail, ...rest }) => rest)

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
  const mockGroupsAndRolesCalls = () => {
    getAssignableGroupsApi.mockResolvedValue([{ text: 'groupName', value: 'group_code' }])
    getSearchableRolesApi.mockResolvedValue([{ roleName: 'roleName', roleCode: 'role_code' }])
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
  const pagination = { offset: 5 }

  const standardReq = {
    flash: jest.fn(),
    query: {},
    get: jest.fn().mockReturnValue('localhost'),
    protocol: 'http',
    originalUrl: '/',
    session: {},
  }

  beforeEach(() => {
    paginationService.getPagination.mockReset()
    getSearchableRolesApi.mockReset()
    searchApi.mockReset()
    pagingApi.mockReset()
    allowDownload.mockReset()
    getAssignableGroupsApi.mockReset()
  })

  it('should call search user render', async () => {
    const req = {
      ...standardReq,
    }
    mockGroupsAndRolesCalls()
    searchApi.mockResolvedValue(noUsers)
    const render = jest.fn()
    await search(req, { render })

    expect(render).toBeCalledWith('searchExternalUsers.njk', {
      searchTitle: 'Search for an external user',
      searchUrl: '/search-external-users',
      maintainUrl: '/manage-external-users',
      pagination: undefined,
      results: [],
      groupDropdownValues: [{ text: 'groupName', value: 'group_code' }],
      roleDropdownValues: [{ text: 'roleName', value: 'role_code' }],
      currentFilter: {
        groupCode: undefined,
        roleCode: undefined,
        status: 'ALL',
        user: undefined,
      },
      downloadUrl: undefined,
      errors: undefined,
    })
  })

  describe('results', () => {
    it('should call external search results render', async () => {
      const req = {
        ...standardReq,
        query: { user: 'joe' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/search-external-users',
        session: {},
      }
      paginationService.getPagination.mockReturnValue(pagination)
      mockGroupsAndRolesCalls()
      mockSearchCall()
      const render = jest.fn()
      await search(req, {
        render,
        locals: { pageable: { page: 5, size: 10, totalElements: 123 } },
      })

      expect(render).toBeCalledWith('searchExternalUsers.njk', {
        searchTitle: 'Search for an external user',
        searchUrl: '/search-external-users',
        maintainUrl: '/manage-external-users',
        results,
        groupDropdownValues: [{ text: 'groupName', value: 'group_code' }],
        roleDropdownValues: [{ text: 'roleName', value: 'role_code' }],
        errors: undefined,
        pagination,
        currentFilter: {
          groupCode: undefined,
          roleCode: undefined,
          status: 'ALL',
          user: 'joe',
        },
        downloadUrl: undefined,
      })
    })

    it('should call external search api', async () => {
      const req = {
        ...standardReq,
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
      }
      paginationService.getPagination.mockReturnValue(pagination)
      mockGroupsAndRolesCalls()
      mockSearchCall()
      const render = jest.fn()
      const locals = { pageable: { page: 5, size: 10, totalElements: 123 } }
      await search(req, {
        render,
        locals,
      })

      expect(searchApi).toBeCalledWith({
        locals,
        user: 'joe',
        roleCode: '',
        groupCode: '',
        status: 'ACTIVE',
        page: undefined,
        size: 20,
      })
    })

    it('should call external search api for all parameters', async () => {
      const req = {
        ...standardReq,
        query: { user: 'joe', groupCode: 'group_code', roleCode: 'role_code', status: 'ACTIVE' },
      }
      paginationService.getPagination.mockReturnValue(pagination)
      mockGroupsAndRolesCalls()
      mockSearchCall()
      const render = jest.fn()
      const locals = { pageable: { page: 2, size: 10, totalElements: 123 } }
      await search(req, {
        render,
        locals,
      })

      expect(searchApi).toBeCalledWith({
        locals,
        user: 'joe',
        roleCode: 'role_code',
        groupCode: 'group_code',
        status: 'ACTIVE',
        page: undefined,
        size: 20,
      })
    })

    it('should call external search api with page and size', async () => {
      const req = {
        ...standardReq,
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'INACTIVE', page: 3, size: 13 },
      }
      paginationService.getPagination.mockReturnValue(pagination)
      mockGroupsAndRolesCalls()
      mockSearchCall()
      const render = jest.fn()
      const locals = { pageable: { page: 5, offset: 20, size: 10, totalElements: 123 } }
      await search(req, {
        render,
        locals,
      })

      expect(searchApi).toBeCalledWith({
        locals,
        user: 'joe',
        roleCode: '',
        groupCode: '',
        status: 'INACTIVE',
        page: 3,
        size: 20,
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
      paginationService.getPagination.mockReturnValue(pagination)
      mockGroupsAndRolesCalls()
      mockSearchCall()
      const render = jest.fn()
      const pageable = { page: 5, size: 10, totalElements: 123 }
      pagingApi.mockReturnValue(pageable)
      await search(req, { render })

      expect(paginationService.getPagination).toBeCalledWith(pageable, new URL('http://localhost/'))
    })

    it('should pass downloadUrl if user has correct permission', async () => {
      const req = {
        ...standardReq,
        query: { user: 'joe', page: 3, size: 13 },
      }
      paginationService.getPagination.mockReturnValue(pagination)
      mockGroupsAndRolesCalls()
      mockSearchCall()
      allowDownload.mockReturnValue(true)
      const render = jest.fn()
      const pageable = { page: 5, size: 10, totalElements: 123 }
      pagingApi.mockReturnValue(pageable)
      await search(req, { render })

      expect(render.mock.calls[0][1].downloadUrl.toString()).toEqual(
        '/search-external-users/download?user=joe&status=ALL&roleCode=&groupCode=',
      )
    })
  })
})
