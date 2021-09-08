const { searchFactory } = require('./searchWithFilter')

describe('search factory', () => {
  const paginationService = { getPagination: jest.fn() }
  const getSearchableRolesApi = jest.fn()
  const searchApi = jest.fn()
  const pagingApi = jest.fn()

  beforeEach(() => {
    getSearchableRolesApi.mockReset()
  })

  describe('DPS', () => {
    const getCaseloadsApi = jest.fn()

    const search = searchFactory(
      paginationService,
      getCaseloadsApi,
      getSearchableRolesApi,
      searchApi,
      pagingApi,
      '/search-with-filter-dps-users',
      'Search for a DPS user',
      true,
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
      getCaseloadsApi.mockReset()
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'Access Role Admin', roleCode: 'ACCESS_ROLE_ADMIN' }])
      getCaseloadsApi.mockResolvedValue([{ text: 'Moorland HMP', value: 'MDI' }])
      searchApi.mockResolvedValue([])
      paginationService.getPagination.mockReturnValue(pagination)
    })

    describe('rendering', () => {
      it('should call renderer with all dependent properties', async () => {
        const req = {
          ...standardReq,
          query: {},
        }

        const render = jest.fn()
        await search(req, { render })
        expect(render).toBeCalledWith('searchWithFilter.njk', {
          searchTitle: 'Search for a DPS user',
          searchUrl: '/search-with-filter-dps-users',
          groupOrPrisonDropdownValues: [{ text: 'Moorland HMP', value: 'MDI' }],
          roleDropdownValues: [{ text: 'Access Role Admin', value: 'ACCESS_ROLE_ADMIN' }],
          errors: undefined,
          dpsSearch: true,
          groupOrPrison: 'caseload',
          showGroupOrPrisonDropdown: false,
          pagination,
          currentFilter: {
            groupCode: undefined,
            roleCode: undefined,
            status: 'ALL',
            user: undefined,
            restrictToActiveGroup: true,
          },
          results: [],
        })
      })

      it('should set current filter with single query parameters', async () => {
        const req = {
          ...standardReq,
          query: {
            user: 'Andy',
            status: 'INACTIVE',
            groupCode: 'MDI',
            roleCode: 'ACCESS_ROLE_ADMIN',
            restrictToActiveGroup: 'false',
          },
        }

        const render = jest.fn()
        await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
        expect(render).toBeCalledWith(
          'searchWithFilter.njk',
          expect.objectContaining({
            currentFilter: {
              groupCode: ['MDI'],
              roleCode: ['ACCESS_ROLE_ADMIN'],
              status: 'INACTIVE',
              user: 'Andy',
              restrictToActiveGroup: false,
            },
          }),
        )
      })

      it('should set list current filters to undefined when no values', async () => {
        const req = {
          ...standardReq,
          query: { user: 'Andy', status: 'INACTIVE', groupCode: '', roleCode: '', restrictToActiveGroup: '' },
        }

        const render = jest.fn()
        await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
        expect(render).toBeCalledWith(
          'searchWithFilter.njk',
          expect.objectContaining({
            currentFilter: {
              groupCode: undefined,
              roleCode: undefined,
              status: 'INACTIVE',
              user: 'Andy',
              restrictToActiveGroup: true,
            },
          }),
        )
      })

      it('should set current filter with multiple role and prison query parameters', async () => {
        const req = {
          ...standardReq,
          query: {
            user: 'Andy',
            status: 'INACTIVE',
            groupCode: ['MDI', 'BXI'],
            roleCode: ['ACCESS_ROLE_ADMIN', 'ACCESS_ROLE_GENERAL'],
            restrictToActiveGroup: 'true',
          },
        }

        const render = jest.fn()
        await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
        expect(render).toBeCalledWith(
          'searchWithFilter.njk',
          expect.objectContaining({
            currentFilter: {
              groupCode: ['MDI', 'BXI'],
              roleCode: ['ACCESS_ROLE_ADMIN', 'ACCESS_ROLE_GENERAL'],
              status: 'INACTIVE',
              user: 'Andy',
              restrictToActiveGroup: true,
            },
          }),
        )
      })
    })
    describe('search api call', () => {
      const render = jest.fn()
      const locals = { pageable: { offset: 20, size: 10, totalElements: 123 } }

      it('should search for everyone with any status when no filters', async () => {
        const req = {
          ...standardReq,
          query: {},
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: '',
          roleCode: '',
          groupCode: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          pageSize: 20,
          pageOffset: 0,
        })
      })

      it('should search with current page offsets and page defaults', async () => {
        const req = {
          ...standardReq,
          query: { user: 'jane', offset: 50 },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: 'jane',
          roleCode: '',
          groupCode: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          pageSize: 20,
          pageOffset: 50,
        })
      })
      it('should search for user with any status with just user filter set', async () => {
        const req = {
          ...standardReq,
          query: { user: 'jane' },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: 'jane',
          roleCode: '',
          groupCode: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          pageSize: 20,
          pageOffset: 0,
        })
      })
      it('should search for prison with active caseload with just group filter set', async () => {
        const req = {
          ...standardReq,
          query: { groupCode: 'MDI' },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: '',
          roleCode: '',
          groupCode: 'MDI',
          activeCaseload: 'MDI',
          status: 'ALL',
          pageSize: 20,
          pageOffset: 0,
        })
      })
      it('should search for prison with active caseload with group filter and restrictToActiveGroup is set to true', async () => {
        const req = {
          ...standardReq,
          query: { groupCode: 'MDI', restrictToActiveGroup: 'true' },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: '',
          roleCode: '',
          groupCode: 'MDI',
          activeCaseload: 'MDI',
          status: 'ALL',
          pageSize: 20,
          pageOffset: 0,
        })
      })
      it('should search for prison without active caseload with group filter and restrictToActiveGroup is set to false set', async () => {
        const req = {
          ...standardReq,
          query: { groupCode: 'MDI', restrictToActiveGroup: 'false' },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: '',
          roleCode: '',
          groupCode: 'MDI',
          activeCaseload: undefined,
          status: 'ALL',
          pageSize: 20,
          pageOffset: 0,
        })
      })
      it('should search for users with role of any status with just role filter set', async () => {
        const req = {
          ...standardReq,
          query: { roleCode: 'OMIC_ADMIN' },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: '',
          roleCode: 'OMIC_ADMIN',
          groupCode: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          pageSize: 20,
          pageOffset: 0,
        })
      })
      it('should search for inactive users with inactive status filter set', async () => {
        const req = {
          ...standardReq,
          query: { status: 'INACTIVE' },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: '',
          roleCode: '',
          groupCode: undefined,
          activeCaseload: undefined,
          status: 'INACTIVE',
          pageSize: 20,
          pageOffset: 0,
        })
      })
      it('should search for active users with active status filter set', async () => {
        const req = {
          ...standardReq,
          query: { status: 'ACTIVE' },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: '',
          roleCode: '',
          groupCode: undefined,
          activeCaseload: undefined,
          status: 'ACTIVE',
          pageSize: 20,
          pageOffset: 0,
        })
      })
      it('should search with all filters when all set', async () => {
        const req = {
          ...standardReq,
          query: { status: 'ACTIVE', user: 'jane', roleCode: 'OMIC_ADMIN', groupCode: 'MDI' },
        }

        await search(req, { render, locals })

        expect(searchApi).toBeCalledWith({
          locals,
          user: 'jane',
          roleCode: 'OMIC_ADMIN',
          groupCode: 'MDI',
          activeCaseload: 'MDI',
          status: 'ACTIVE',
          pageSize: 20,
          pageOffset: 0,
        })
      })
    })
  })
})
