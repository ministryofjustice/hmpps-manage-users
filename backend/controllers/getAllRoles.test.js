const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { viewRolesFactory } = require('./getAllRoles')
const { ManageUsersEvent } = require('../audit')
const { auditAction } = require('../utils/testUtils')

const allRoles = [
  {
    text: 'role1',
    value: 'r1',
  },
  {
    text: 'role2',
    value: 'r2',
  },
  {
    text: 'role3',
    value: 'r3',
  },
]
const roles = allRoles.map((r) => ({ text: r.roleName, value: r.roleCode }))

describe('view roles factory', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  const paginationService = { getPagination: jest.fn() }
  const pagingApi = jest.fn()
  const getPagedRolesApi = jest.fn()

  const standardReq = {
    params: {},
    flash: jest.fn(),
    get: jest.fn().mockReturnValue('localhost'),
    protocol: 'http',
    originalUrl: '/',
    session: { userDetails: { username: 'username' } },
  }

  beforeEach(() => {
    paginationService.getPagination.mockReset()
    pagingApi.mockReset()
    getPagedRolesApi.mockReset()
  })

  const mockRolesCall = () => {
    getPagedRolesApi.mockResolvedValue(roles)
  }

  describe('ROLES', () => {
    const getPagedRoles = viewRolesFactory(paginationService, pagingApi, getPagedRolesApi, '/manage-roles')

    it('should call view Roles results render', async () => {
      const req = {
        ...standardReq,
        query: {},
      }
      const pagination = { offset: 0 }
      paginationService.getPagination.mockReturnValue(pagination)
      mockRolesCall()
      const render = jest.fn()
      await getPagedRoles.index(req, {
        render,
        locals: { pageable: { offset: 20, size: 10, totalElements: 123 } },
      })
      expect(render).toHaveBeenCalledWith('roles.njk', {
        maintainUrl: '/manage-roles',
        roles,
        currentFilter: {
          adminTypes: 'ALL',
          roleCode: undefined,
          roleName: undefined,
        },
        errors: undefined,
        pagination,
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.LIST_ROLES_ATTEMPT))
    })

    it('should set current filter with single query parameters', async () => {
      const req = {
        ...standardReq,
        query: { roleCode: 'user' },
      }
      const pagination = { offset: 0 }
      paginationService.getPagination.mockReturnValue(pagination)
      mockRolesCall()
      const render = jest.fn()
      await getPagedRoles.index(req, {
        render,
        locals: { pageable: { offset: 20, size: 10, totalElements: 123 } },
      })
      expect(render).toHaveBeenCalledWith('roles.njk', {
        maintainUrl: '/manage-roles',
        roles,
        currentFilter: {
          adminTypes: 'ALL',
          roleCode: 'user',
          roleName: undefined,
        },
        errors: undefined,
        pagination,
      })
    })

    it('should search with all filters when all set', async () => {
      const req = {
        ...standardReq,
        query: { roleCode: 'user', roleName: 'Admin' },
      }
      const pagination = { offset: 0 }
      paginationService.getPagination.mockReturnValue(pagination)
      mockRolesCall()
      const render = jest.fn()
      await getPagedRoles.index(req, {
        render,
        locals: { pageable: { offset: 20, size: 10, totalElements: 123 } },
      })
      expect(render).toHaveBeenCalledWith('roles.njk', {
        maintainUrl: '/manage-roles',
        roles,
        currentFilter: {
          adminTypes: 'ALL',
          roleCode: 'user',
          roleName: 'Admin',
        },
        errors: undefined,
        pagination,
      })
    })
  })
})
