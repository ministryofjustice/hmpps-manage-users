const { searchFactory } = require('./searchDpsUsers')
const config = require('../config').default
const { auditService } = require('../services/auditService')
const { UUID_REGEX } = require('../utils/testConstants')

describe('search factory', () => {
  const paginationService = { getPagination: jest.fn() }
  const getSearchableRolesApi = jest.fn()
  const findUsersApi = jest.fn()
  const allowDownload = jest.fn()

  beforeEach(() => {
    getSearchableRolesApi.mockReset()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
    jest.clearAllMocks()
  })

  describe('DPS', () => {
    const getCaseloadsApi = jest.fn()

    const search = searchFactory(
      paginationService,
      getCaseloadsApi,
      getSearchableRolesApi,
      findUsersApi,
      '/search-with-filter-dps-users',
      '/manage-dps-users',
      'Search for a DPS user',
      allowDownload,
    )

    const pagination = { offset: 5 }
    const standardReq = {
      flash: jest.fn(),
      query: {},
      get: jest.fn().mockReturnValue('localhost'),
      protocol: 'http',
      originalUrl: '/',
      session: { userDetails: { username: 'some username' } },
    }
    const expectedViewDpsUserAttemptAuditMessage = expect.objectContaining({
      action: 'VIEW_DPS_USERS_ATTEMPT',
      correlationId: expect.stringMatching(UUID_REGEX),
      who: 'some username',
    })

    beforeEach(() => {
      getCaseloadsApi.mockReset()
      getSearchableRolesApi.mockResolvedValue([{ roleName: 'Access Role Admin', roleCode: 'ACCESS_ROLE_ADMIN' }])
      getCaseloadsApi.mockResolvedValue([{ text: 'Moorland HMP', value: 'MDI' }])
      findUsersApi.mockResolvedValue({ searchResults: [], totalElements: 0, number: 0, page: 0 })
      allowDownload.mockReset()
      allowDownload.mockReturnValue(true)
      paginationService.getPagination.mockReturnValue(pagination)
      config.downloadRecordLimit = 100
    })

    describe('rendering', () => {
      it('should call renderer with all dependent properties', async () => {
        const req = {
          ...standardReq,
          query: {},
        }

        const render = jest.fn()
        await search(req, { render })
        expect(render).toBeCalledWith('searchDpsUsers.njk', {
          searchTitle: 'Search for a DPS user',
          searchUrl: '/search-with-filter-dps-users',
          prisonDropdownValues: [{ text: 'Moorland HMP', value: 'MDI' }],
          roleDropdownValues: [{ text: 'Access Role Admin', value: 'ACCESS_ROLE_ADMIN' }],
          errors: undefined,
          showPrisonDropdown: false,
          pagination,
          currentFilter: {
            groupCode: undefined,
            roleCode: undefined,
            status: 'ALL',
            user: undefined,
            restrictToActiveGroup: true,
            inclusiveRoles: undefined,
            showOnlyLSAs: undefined,
          },
          results: [],
          downloadUrl:
            '/search-with-filter-dps-users/user-download?user=&status=ALL&roleCode=&groupCode=&restrictToActiveGroup=true&inclusiveRoles=&showOnlyLSAs=',
          maintainUrl: '/manage-dps-users',
          downloadRecordLimit: 100,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should publish attempt and failure audit messages when userDetail render fails', async () => {
        const render = jest.fn()
        findUsersApi.mockRejectedValue(new Error('Error for test'))

        try {
          await search({ ...standardReq, query: {} }, { render })
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toEqual('Error for test')
        }

        expect(render).not.toHaveBeenCalled()
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'VIEW_DPS_USERS_FAILURE',
            correlationId: expect.stringMatching(UUID_REGEX),
            who: 'some username',
          }),
        )
      })

      it('should call renderer with download url when download is allowed', async () => {
        allowDownload.mockReturnValue(true)

        const req = {
          ...standardReq,
          query: {},
        }

        const render = jest.fn()
        await search(req, { render })
        expect(render).toBeCalledWith(
          'searchDpsUsers.njk',
          expect.objectContaining({
            downloadUrl:
              '/search-with-filter-dps-users/user-download?user=&status=ALL&roleCode=&groupCode=&restrictToActiveGroup=true&inclusiveRoles=&showOnlyLSAs=',
          }),
        )
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should not call renderer with download url when download is not allowed', async () => {
        allowDownload.mockReturnValue(false)

        const req = {
          ...standardReq,
          query: {},
        }

        const render = jest.fn()
        await search(req, { render })
        expect(render).toBeCalledWith(
          'searchDpsUsers.njk',
          expect.not.objectContaining({
            downloadUrl:
              '/search-with-filter-dps-users/user-download?user=&status=ALL&roleCode=&groupCode=&restrictToActiveGroup=true&size=undefined',
          }),
        )
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
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
            inclusiveRoles: 'true',
            showOnlyLSAs: 'true',
          },
        }

        const render = jest.fn()
        await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
        expect(render).toBeCalledWith(
          'searchDpsUsers.njk',
          expect.objectContaining({
            currentFilter: {
              groupCode: ['MDI'],
              roleCode: ['ACCESS_ROLE_ADMIN'],
              status: 'INACTIVE',
              user: 'Andy',
              restrictToActiveGroup: false,
              inclusiveRoles: 'true',
              showOnlyLSAs: 'true',
            },
            downloadUrl:
              '/search-with-filter-dps-users/user-download?user=Andy&status=INACTIVE&roleCode=ACCESS_ROLE_ADMIN&groupCode=MDI&restrictToActiveGroup=false&inclusiveRoles=true&showOnlyLSAs=true',
          }),
        )
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should set list current filters to undefined when no values', async () => {
        const req = {
          ...standardReq,
          query: {
            user: 'Andy',
            status: 'INACTIVE',
            groupCode: '',
            roleCode: '',
            restrictToActiveGroup: '',
            inclusiveRoles: '',
            showOnlyLSAs: '',
          },
        }

        const render = jest.fn()
        await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
        expect(render).toBeCalledWith(
          'searchDpsUsers.njk',
          expect.objectContaining({
            currentFilter: {
              groupCode: undefined,
              roleCode: undefined,
              status: 'INACTIVE',
              user: 'Andy',
              restrictToActiveGroup: true,
              size: undefined,
              inclusiveRoles: '',
              showOnlyLSAs: '',
            },
            downloadUrl:
              '/search-with-filter-dps-users/user-download?user=Andy&status=INACTIVE&roleCode=&groupCode=&restrictToActiveGroup=true&inclusiveRoles=&showOnlyLSAs=',
          }),
        )
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
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
            inclusiveRoles: 'true',
            showOnlyLSAs: 'true',
          },
        }

        const render = jest.fn()
        await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })
        expect(render).toBeCalledWith(
          'searchDpsUsers.njk',
          expect.objectContaining({
            currentFilter: {
              groupCode: ['MDI', 'BXI'],
              roleCode: ['ACCESS_ROLE_ADMIN', 'ACCESS_ROLE_GENERAL'],
              status: 'INACTIVE',
              user: 'Andy',
              restrictToActiveGroup: true,
              inclusiveRoles: 'true',
              showOnlyLSAs: 'true',
            },
            downloadUrl:
              '/search-with-filter-dps-users/user-download?user=Andy&status=INACTIVE&roleCode=ACCESS_ROLE_ADMIN&roleCode=ACCESS_ROLE_GENERAL&groupCode=MDI&groupCode=BXI&restrictToActiveGroup=true&inclusiveRoles=true&showOnlyLSAs=true',
          }),
        )
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should replace previous breadcrumb information', async () => {
        const req = {
          ...standardReq,
          originalUrl: '/search-with-filter-dps-users',
        }

        const render = jest.fn()
        await search(req, { render, locals: { user: { maintainAccessAdmin: true } } })

        expect(req.session.searchResultsUrl).toEqual(req.originalUrl)
        expect(req.session.searchTitle).toEqual('Search for a DPS user')
        expect(req.session.searchUrl).toEqual(req.originalUrl)
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
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

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: undefined,
          accessRoles: undefined,
          caseload: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should trim username of any leading or trailing spaces', async () => {
        const req = {
          ...standardReq,
          query: { user: ' jane ' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: 'jane',
          accessRoles: undefined,
          caseload: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search with current page and page defaults', async () => {
        const req = {
          ...standardReq,
          query: { user: 'jane', page: 3 },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: 'jane',
          accessRoles: undefined,
          caseload: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          size: 20,
          page: 3,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search for user with any status with just user filter set', async () => {
        const req = {
          ...standardReq,
          query: { user: 'jane' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: 'jane',
          accessRoles: undefined,
          caseload: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search for prison with active caseload with just group filter set', async () => {
        const req = {
          ...standardReq,
          query: { groupCode: 'MDI' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: undefined,
          accessRoles: undefined,
          caseload: 'MDI',
          activeCaseload: 'MDI',
          status: 'ALL',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search for prison with active caseload with group filter and restrictToActiveGroup is set to true', async () => {
        const req = {
          ...standardReq,
          query: { groupCode: 'MDI', restrictToActiveGroup: 'true' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: undefined,
          accessRoles: undefined,
          caseload: 'MDI',
          activeCaseload: 'MDI',
          status: 'ALL',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search for prison without active caseload with group filter and restrictToActiveGroup is set to false set', async () => {
        const req = {
          ...standardReq,
          query: { groupCode: 'MDI', restrictToActiveGroup: 'false' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: undefined,
          accessRoles: undefined,
          caseload: 'MDI',
          activeCaseload: undefined,
          status: 'ALL',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search for users with role of any status with just role filter set', async () => {
        const req = {
          ...standardReq,
          query: { roleCode: 'OMIC_ADMIN' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: undefined,
          accessRoles: ['OMIC_ADMIN'],
          caseload: undefined,
          activeCaseload: undefined,
          status: 'ALL',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search for inactive users with inactive status filter set', async () => {
        const req = {
          ...standardReq,
          query: { status: 'INACTIVE' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: undefined,
          accessRoles: undefined,
          caseload: undefined,
          activeCaseload: undefined,
          status: 'INACTIVE',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search for active users with active status filter set', async () => {
        const req = {
          ...standardReq,
          query: { status: 'ACTIVE' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: undefined,
          accessRoles: undefined,
          caseload: undefined,
          activeCaseload: undefined,
          status: 'ACTIVE',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })

      it('should search with all filters when all set', async () => {
        const req = {
          ...standardReq,
          query: { status: 'ACTIVE', user: 'jane', roleCode: 'OMIC_ADMIN', groupCode: 'MDI' },
        }

        await search(req, { render, locals })

        expect(findUsersApi).toBeCalledWith({
          locals,
          user: 'jane',
          accessRoles: ['OMIC_ADMIN'],
          caseload: 'MDI',
          activeCaseload: 'MDI',
          status: 'ACTIVE',
          size: 20,
        })
        expect(auditService.sendAuditMessage).toHaveBeenCalledWith(expectedViewDpsUserAttemptAuditMessage)
      })
    })
  })
})
