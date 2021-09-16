const searchApiFactory = require('./searchApiFactory')

describe('Search API Factory', () => {
  const prisonApi = {
    userSearchAdmin: jest.fn(),
    userSearch: jest.fn(),
    getRolesAdmin: jest.fn(),
    getRoles: jest.fn(),
    getCaseloads: jest.fn(),
  }
  const oauthApi = { userEmails: jest.fn() }
  const { searchApi, searchableRoles, caseloads } = searchApiFactory(prisonApi, oauthApi)

  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('searchApi', () => {
    it('will call admin search with admin role context', async () => {
      prisonApi.userSearchAdmin.mockResolvedValue([])

      await searchApi({
        locals: { user: { maintainAccessAdmin: true } },
        user: 'jane',
        groupCode: 'MDI',
        roleCode: 'OMIC_ADMIN',
        activeCaseload: 'LEI',
        status: 'ACTIVE',
        pageSize: 20,
        pageOffset: 40,
      })

      expect(prisonApi.userSearchAdmin).toBeCalledWith(
        {
          user: { maintainAccessAdmin: true },
          requestHeaders: {
            'page-limit': 20,
            'page-offset': 40,
          },
        },
        {
          nameFilter: 'jane',
          roleFilter: 'OMIC_ADMIN',
          status: 'ACTIVE',
          caseload: 'MDI',
          activeCaseload: 'LEI',
        },
      )
    })
    it('will call normal search without admin role context and not pass caseload filter', async () => {
      prisonApi.userSearch.mockResolvedValue([])

      await searchApi({
        locals: { user: { maintainAccessAdmin: false } },
        user: 'jane',
        groupCode: 'MDI',
        roleCode: 'OMIC_ADMIN',
        activeCaseload: 'LEI',
        status: 'ACTIVE',
        pageSize: 20,
        pageOffset: 40,
      })

      expect(prisonApi.userSearch).toBeCalledWith(
        {
          user: { maintainAccessAdmin: false },
          requestHeaders: {
            'page-limit': 20,
            'page-offset': 40,
          },
        },
        {
          nameFilter: 'jane',
          roleFilter: 'OMIC_ADMIN',
          status: 'ACTIVE',
        },
      )
    })
    it('will retrieve emails for each user found and add to results', async () => {
      prisonApi.userSearchAdmin.mockResolvedValue([
        { username: 'jane', activeCaseLoadId: 'MDI' },
        { username: 'jill', activeCaseLoadId: 'MDI' },
      ])
      oauthApi.userEmails.mockResolvedValue([{ username: 'jane', email: 'jane@email.com' }])

      const results = await searchApi({
        locals: {
          user: { maintainAccessAdmin: true },
        },
        pageSize: 20,
        pageOffset: 40,
      })

      expect(oauthApi.userEmails).toBeCalledWith(
        {
          user: { maintainAccessAdmin: true },
          requestHeaders: {
            'page-limit': 20,
            'page-offset': 40,
          },
        },
        ['jane', 'jill'],
      )
      expect(results).toEqual([
        { username: 'jane', activeCaseLoadId: 'MDI', email: 'jane@email.com' },
        { username: 'jill', activeCaseLoadId: 'MDI' },
      ])
    })
  })
  describe('searchableRoles', () => {
    it('will get admin roles with admin role context', async () => {
      prisonApi.getRolesAdmin.mockResolvedValue([])

      await searchableRoles({ user: { maintainAccessAdmin: true } })

      expect(prisonApi.getRolesAdmin).toBeCalledWith({
        user: { maintainAccessAdmin: true },
      })
    })
    it('will get normal roles without admin role context', async () => {
      prisonApi.getRolesAdmin.mockResolvedValue([])

      await searchableRoles({ user: { maintainAccessAdmin: false } })

      expect(prisonApi.getRoles).toBeCalledWith({
        user: { maintainAccessAdmin: false },
      })
    })
  })
  describe('caseloads', () => {
    it('will get caseloads with admin in context', async () => {
      prisonApi.getCaseloads.mockResolvedValue([
        { description: 'Moorland HMP', agencyId: 'MDI' },
        { description: 'Leeds HMP', agencyId: 'LEI' },
      ])

      const caseloadOptions = await caseloads({ user: { maintainAccessAdmin: true } })

      expect(prisonApi.getCaseloads).toBeCalledWith({
        user: { maintainAccessAdmin: true },
      })

      expect(caseloadOptions).toEqual([
        { text: 'Leeds HMP', value: 'LEI' },
        { text: 'Moorland HMP', value: 'MDI' },
      ])
    })
    it('will not get caseload options when admin not in context', async () => {
      const caseloadOptions = await caseloads({ user: { maintainAccessAdmin: false } })

      expect(prisonApi.getCaseloads).not.toHaveBeenCalled()

      expect(caseloadOptions).toEqual([])
    })
  })
})
