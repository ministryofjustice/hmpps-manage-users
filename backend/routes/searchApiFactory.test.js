const searchApiFactory = require('./searchApiFactory')

describe('Search API Factory', () => {
  const prisonApi = {
    userSearchAdmin: jest.fn(),
    userSearch: jest.fn(),
    getPrisons: jest.fn(),
  }
  const nomisUsersAndRolesApi = {
    getRoles: jest.fn(),
    getCaseloads: jest.fn(),
    userSearch: jest.fn(),
  }
  const manageUsersApi = {
    getRoles: jest.fn(),
  }
  const oauthApi = { userEmails: jest.fn() }
  const { searchApi, searchableRoles, prisons, caseloads, findUsersApi } = searchApiFactory(
    prisonApi,
    oauthApi,
    nomisUsersAndRolesApi,
    manageUsersApi,
  )

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
  })
  describe('findUsersApi', () => {
    const noResults = {
      content: [],
      last: true,
      totalPages: 0,
      totalElements: 0,
      size: 20,
      number: 0,
      sort: {
        empty: false,
        sorted: true,
        unsorted: false,
      },
      first: true,
      numberOfElements: 0,
      empty: true,
    }
    it('will call userSearch with admin role context', async () => {
      nomisUsersAndRolesApi.userSearch.mockResolvedValue(noResults)

      await findUsersApi({
        locals: { user: { maintainAccessAdmin: true } },
        user: 'jane',
        caseload: 'MDI',
        accessRoles: 'OMIC_ADMIN',
        activeCaseload: 'LEI',
        status: 'ACTIVE',
        size: 20,
        page: 2,
      })

      expect(nomisUsersAndRolesApi.userSearch).toBeCalledWith(
        {
          user: { maintainAccessAdmin: true },
        },
        {
          nameFilter: 'jane',
          accessRoles: 'OMIC_ADMIN',
          status: 'ACTIVE',
          caseload: 'MDI',
          activeCaseload: 'LEI',
          size: 20,
          page: 2,
        },
      )
    })
    it('will call userSearch without admin role context', async () => {
      nomisUsersAndRolesApi.userSearch.mockResolvedValue(noResults)

      await findUsersApi({
        locals: { user: { maintainAccessAdmin: false } },
        user: 'jane',
        accessRoles: 'OMIC_ADMIN',
        status: 'ACTIVE',
        size: 20,
        page: 2,
      })

      expect(nomisUsersAndRolesApi.userSearch).toBeCalledWith(
        {
          user: { maintainAccessAdmin: false },
        },
        {
          nameFilter: 'jane',
          accessRoles: 'OMIC_ADMIN',
          status: 'ACTIVE',
          size: 20,
          page: 2,
        },
      )
    })
  })

  describe('searchableRoles', () => {
    it('will filter admin roles with non admin role context', async () => {
      manageUsersApi.getRoles.mockResolvedValue([
        {
          roleCode: 'CODE2',
          roleName: 'AAA1',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
        {
          roleCode: 'CODE3',
          roleName: 'BBB1',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
      ])

      const roles = await searchableRoles({ user: { maintainAccessAdmin: false } })

      expect(manageUsersApi.getRoles).toBeCalledWith(
        {
          user: { maintainAccessAdmin: false },
        },
        { adminTypes: 'DPS_LSA' },
      )

      expect(roles).toEqual([
        {
          roleCode: 'CODE2',
          roleName: 'AAA1',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
        {
          roleCode: 'CODE3',
          roleName: 'BBB1',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
      ])
    })

    it('will filter admin roles with non admin role context', async () => {
      manageUsersApi.getRoles.mockResolvedValue([
        {
          roleCode: 'CODE1',
          roleName: 'ZZZ1',
          roleDescription: 'Maintaining roles for everyone',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
          ],
        },
        {
          roleCode: 'CODE3',
          roleName: 'BBB1',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
        {
          roleCode: 'CODE2',
          roleName: 'AAA1',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
      ])

      const roles = await searchableRoles({ user: { maintainAccessAdmin: true } })

      expect(manageUsersApi.getRoles).toBeCalledWith(
        {
          user: { maintainAccessAdmin: true },
        },
        { adminTypes: 'DPS_ADM' },
      )

      expect(roles).toEqual([
        {
          roleCode: 'CODE1',
          roleName: 'ZZZ1',
          roleDescription: 'Maintaining roles for everyone',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
          ],
        },
        {
          roleCode: 'CODE3',
          roleName: 'BBB1',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
        {
          roleCode: 'CODE2',
          roleName: 'AAA1',
          adminType: [
            {
              adminTypeCode: 'DPS_ADM',
              adminTypeName: 'DPS Central Administrator',
            },
            {
              adminTypeCode: 'DPS_LSA',
              adminTypeName: 'DPS Local System Administrator',
            },
          ],
        },
      ])
    })

    it('will get admin roles with admin role context', async () => {
      manageUsersApi.getRoles.mockResolvedValue([])

      await searchableRoles({ user: { maintainAccessAdmin: true } })

      expect(manageUsersApi.getRoles).toBeCalledWith(
        {
          user: { maintainAccessAdmin: true },
        },
        { adminTypes: 'DPS_ADM' },
      )
    })

    it('will get normal roles without admin role context', async () => {
      manageUsersApi.getRoles.mockResolvedValue([])

      await searchableRoles({ user: { maintainAccessAdmin: false } })

      expect(manageUsersApi.getRoles).toBeCalledWith(
        {
          user: { maintainAccessAdmin: false },
        },
        { adminTypes: 'DPS_LSA' },
      )
    })
  })

  describe('prisons', () => {
    it('will get prisons with admin in context', async () => {
      prisonApi.getPrisons.mockResolvedValue([
        { description: 'Moorland HMP', agencyId: 'MDI' },
        { description: 'Leeds HMP', agencyId: 'LEI' },
      ])

      const caseloadOptions = await prisons({ user: { maintainAccessAdmin: true } })

      expect(prisonApi.getPrisons).toBeCalledWith({
        user: { maintainAccessAdmin: true },
      })

      expect(caseloadOptions).toEqual([
        { text: 'Leeds HMP', value: 'LEI' },
        { text: 'Moorland HMP', value: 'MDI' },
      ])
    })
    it('will not get prisons options when admin not in context', async () => {
      const caseloadOptions = await prisons({ user: { maintainAccessAdmin: false } })

      expect(prisonApi.getPrisons).not.toHaveBeenCalled()

      expect(caseloadOptions).toEqual([])
    })
  })
  describe('caseloads', () => {
    it('will get caseloads with admin in context', async () => {
      nomisUsersAndRolesApi.getCaseloads.mockResolvedValue([
        { name: 'Moorland HMP', id: 'MDI' },
        { name: 'Leeds HMP', id: 'LEI' },
      ])

      const caseloadOptions = await caseloads({ user: { maintainAccessAdmin: true } })

      expect(nomisUsersAndRolesApi.getCaseloads).toBeCalledWith({
        user: { maintainAccessAdmin: true },
      })

      expect(caseloadOptions).toEqual([
        { text: 'Leeds HMP', value: 'LEI' },
        { text: 'Moorland HMP', value: 'MDI' },
      ])
    })
    it('will not get caseloads options when admin not in context', async () => {
      const caseloadOptions = await caseloads({ user: { maintainAccessAdmin: false } })

      expect(nomisUsersAndRolesApi.getCaseloads).not.toHaveBeenCalled()

      expect(caseloadOptions).toEqual([])
    })
  })
})
