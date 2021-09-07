const { viewRolesFactory } = require('./getAllRoles')

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
  const paginationService = { getPagination: jest.fn() }
  const pagingApi = jest.fn()
  const getAllRolesApi = jest.fn()

  beforeEach(() => {
    paginationService.getPagination.mockReset()
    pagingApi.mockReset()
    getAllRolesApi.mockReset()
  })

  const mockRolesCall = () => {
    getAllRolesApi.mockResolvedValue(roles)
  }

  describe('ROLES', () => {
    const getAllRoles = viewRolesFactory(paginationService, pagingApi, getAllRolesApi, '/manage-roles')

    it('should call view Roles results render', async () => {
      const req = {
        query: {},
        params: {},
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session: {},
      }
      const pagination = { offset: 0 }
      paginationService.getPagination.mockReturnValue(pagination)
      mockRolesCall()
      const render = jest.fn()
      await getAllRoles.index(req, {
        render,
        locals: { pageable: { offset: 20, size: 10, totalElements: 123 } },
      })
      expect(render).toBeCalledWith('roles.njk', {
        maintainUrl: '/manage-roles',
        roles,
        errors: undefined,
        pagination,
      })
    })
  })
})