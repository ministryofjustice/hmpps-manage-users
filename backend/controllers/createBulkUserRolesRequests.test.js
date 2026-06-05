const { createBulkUserRolesRequestsFactory } = require('./createBulkUserRolesRequests')

describe('change user roles in bulk', () => {
  const getSearchableRolesApi = jest.fn()
  const manageUsersApi = { getSearchableRolesApi }
  const bulkUserRolesController = createBulkUserRolesRequestsFactory(getSearchableRolesApi)
  const render = jest.fn()
  const redirect = jest.fn()

  const req = {
    body: {},
    session: {
      userDetails: {
        username: 'Robert Bobby',
      },
      bulkUserRoles: {},
    },
  }
  const resp = { render, redirect }

  beforeEach(() => {
    jest.clearAllMocks()
    req.session.bulkUserRoles = {}
  })

  describe('start new request', () => {
    it('start new request returns the expected page', async () => {
      await bulkUserRolesController.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: {} })
    })

    it('start new request sets session.bulkUserRoles object if not present', async () => {
      req.session.bulkUserRoles = undefined
      await bulkUserRolesController.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: {} })
    })

    it('start new request passes existing session.bulkUserRoles object if present', async () => {
      req.session.bulkUserRoles = { jiraReference: '12345' }
      await bulkUserRolesController.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: { jiraReference: '12345' } })
    })
  })

  describe('Post Jira Reference', () => {
    it('submitting empty Jira Reference returns to input page with error message', async () => {
      await bulkUserRolesController.postJiraReference(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', {
        jiraReferenceError: 'jira reference is required and cannot be empty',
      })
    })

    it('submitting whitespace Jira Reference returns to input page with error message', async () => {
      req.body = { jiraReference: '   ' }
      await bulkUserRolesController.postJiraReference(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', {
        jiraReferenceError: 'jira reference is required and cannot be empty',
      })
    })

    it('submitting valid Jira Reference redirects to select roles page', async () => {
      req.body = { jiraReference: '12345' }
      await bulkUserRolesController.postJiraReference(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/select-roles')
      expect(req.session.bulkUserRoles).not.toBeNull()
      expect(req.session.bulkUserRoles.jiraReference).toBeDefined()
      expect(req.session.bulkUserRoles.dateRequested).toBeDefined()
      expect(req.session.bulkUserRoles.requestedBy).toEqual('Robert Bobby')
      expect(req.session.bulkUserRoles.jiraReference).toEqual('12345')
    })

    it('submitting valid Jira Reference when all other fields are present redirects to summary page', async () => {
      req.session.bulkUserRoles = {
        dateRequested: new Date(),
        jiraReference: undefined,
        requestedBy: 'Robert Bobby',
        users: ['u1', 'u2', 'u3'],
        roles: ['r1', 'r2', 'r3'],
        uploadFile: 'file-content-here',
      }
      req.body = { jiraReference: '12345' }
      await bulkUserRolesController.postJiraReference(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')
      expect(render).not.toHaveBeenCalled()

      expect(req.session.bulkUserRoles).not.toBeNull()
      expect(req.session.bulkUserRoles.dateRequested).toBeDefined()
      expect(req.session.bulkUserRoles.jiraReference).toEqual('12345')
      expect(req.session.bulkUserRoles.requestedBy).toEqual('Robert Bobby')
      expect(req.session.bulkUserRoles.users).toEqual(['u1', 'u2', 'u3'])
      expect(req.session.bulkUserRoles.roles).toEqual(['r1', 'r2', 'r3'])
      expect(req.session.bulkUserRoles.uploadFile).toEqual('file-content-here')
    })

    test.each([
      {
        dateRequested: undefined,
        requestedBy: undefined,
        users: undefined,
        roles: undefined,
        uploadFile: undefined,
      },
      {
        dateRequested: new Date(),
        requestedBy: undefined,
        users: undefined,
        roles: undefined,
        uploadFile: undefined,
      },
      {
        dateRequested: new Date(),
        requestedBy: 'ME',
        users: undefined,
        roles: undefined,
        uploadFile: undefined,
      },
      {
        dateRequested: new Date(),
        requestedBy: 'ME',
        users: ['u1'],
        roles: undefined,
        uploadFile: undefined,
      },
      {
        dateRequested: new Date(),
        requestedBy: 'ME',
        users: ['u1'],
        roles: ['r1'],
        uploadFile: undefined,
      },
    ])(
      'submitting valid Jira Reference redirects to select roles page when not all request fields have been set',
      async (sessionValue) => {
        req.session.bulkUserRoles = sessionValue
        req.body = { jiraReference: '12345' }
        await bulkUserRolesController.postJiraReference(req, resp)

        expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/select-roles')
        expect(render).not.toHaveBeenCalled()

        expect(req.session.bulkUserRoles).not.toBeNull()
        expect(req.session.bulkUserRoles.dateRequested).toEqual(sessionValue.dateRequested)
        expect(req.session.bulkUserRoles.jiraReference).toEqual('12345')
        expect(req.session.bulkUserRoles.requestedBy).toEqual(sessionValue.requestedBy)
        expect(req.session.bulkUserRoles.users).toEqual(sessionValue.users)
        expect(req.session.bulkUserRoles.roles).toEqual(sessionValue.roles)
        expect(req.session.bulkUserRoles.uploadFile).toEqual(sessionValue.uploadFile)
      },
    )
  })

  describe('Get select roles', () => {
    it('get select roles returns the expected page with the list of roles', async () => {
      getSearchableRolesApi.mockResolvedValue([
        { roleName: 'r1', roleCode: 'ROLE_ONE' },
        { roleName: 'r2', roleCode: 'ROLE_TWO' },
        { roleName: 'r3', roleCode: 'ROLE_THREE' },
      ])

      await bulkUserRolesController.getSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesSelectRoles.njk', {
        rolesList: [
          { text: 'r1', value: 'ROLE_ONE' },
          { text: 'r2', value: 'ROLE_TWO' },
          { text: 'r3', value: 'ROLE_THREE' },
        ],
        selectedRoles: [],
      })
    })
  })
})
