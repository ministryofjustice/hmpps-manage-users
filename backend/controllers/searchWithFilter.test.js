const { searchFactory } = require('./searchWithFilter')

describe('search factory', () => {
  const getSearchableRolesApi = jest.fn()
  const allowDownload = jest.fn()

  beforeEach(() => {
    getSearchableRolesApi.mockReset()
    allowDownload.mockReset()
  })

  describe('DPS', () => {
    const getCaseloadsApi = jest.fn()

    const search = searchFactory(
      getCaseloadsApi,
      getSearchableRolesApi,
      '/search-with-filter-dps-users',
      'Search for a DPS user',
      true,
    )

    beforeEach(() => {
      getCaseloadsApi.mockReset()
    })

    it('should call search filter render with no filter', async () => {
      const req = { flash: jest.fn(), query: {} }
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'Access Role Admin', roleCode: 'ACCESS_ROLE_ADMIN' }])
      getCaseloadsApi.mockResolvedValue([{ text: 'Moorland HMP', value: 'MDI' }])

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
        currentFilter: {
          activeCaseload: undefined,
          roleCode: undefined,
          status: 'ALL',
          user: undefined,
        },
      })
    })

    it('should set current filter with single query parameters', async () => {
      const req = {
        flash: jest.fn(),
        query: { user: 'Andy', status: 'INACTIVE', activeCaseload: 'MDI', roleCode: 'ACCESS_ROLE_ADMIN' },
      }
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'name', roleCode: 'code' }])
      getCaseloadsApi.mockResolvedValue([{ text: 'name', value: 'code' }])

      const render = jest.fn()
      await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
      expect(render).toBeCalledWith(
        'searchWithFilter.njk',
        expect.objectContaining({
          currentFilter: {
            activeCaseload: ['MDI'],
            roleCode: ['ACCESS_ROLE_ADMIN'],
            status: 'INACTIVE',
            user: 'Andy',
          },
        }),
      )
    })

    it('should set list current filters to undefined when no values', async () => {
      const req = { flash: jest.fn(), query: { user: 'Andy', status: 'INACTIVE', activeCaseload: '', roleCode: '' } }
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'name', roleCode: 'code' }])
      getCaseloadsApi.mockResolvedValue([{ text: 'name', value: 'code' }])

      const render = jest.fn()
      await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
      expect(render).toBeCalledWith(
        'searchWithFilter.njk',
        expect.objectContaining({
          currentFilter: {
            activeCaseload: undefined,
            roleCode: undefined,
            status: 'INACTIVE',
            user: 'Andy',
          },
        }),
      )
    })

    it('should set current filter with multiple role and prison query parameters', async () => {
      const req = {
        flash: jest.fn(),
        query: {
          user: 'Andy',
          status: 'INACTIVE',
          activeCaseload: ['MDI', 'BXI'],
          roleCode: ['ACCESS_ROLE_ADMIN', 'ACCESS_ROLE_GENERAL'],
        },
      }
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'name', roleCode: 'code' }])
      getCaseloadsApi.mockResolvedValue([{ text: 'name', value: 'code' }])

      const render = jest.fn()
      await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
      expect(render).toBeCalledWith(
        'searchWithFilter.njk',
        expect.objectContaining({
          currentFilter: {
            activeCaseload: ['MDI', 'BXI'],
            roleCode: ['ACCESS_ROLE_ADMIN', 'ACCESS_ROLE_GENERAL'],
            status: 'INACTIVE',
            user: 'Andy',
          },
        }),
      )
    })
  })
})
