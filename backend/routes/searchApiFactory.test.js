const searchApiFactory = require('./searchApiFactory')

describe('Search API Factory', () => {
  const nomisUsersAndRolesApi = {
    getRoles: jest.fn(),
    getCaseloads: jest.fn(),
    userSearch: jest.fn(),
  }
  const manageUsersApi = {
    getRoles: jest.fn(),
  }
  const oauthApi = { userEmails: jest.fn() }
  const { searchableRoles, caseloads, findUsersApi } = searchApiFactory(oauthApi, nomisUsersAndRolesApi, manageUsersApi)

  beforeEach(() => {
    jest.resetAllMocks()
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
