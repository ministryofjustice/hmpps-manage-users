const { createBulkUserRolesRequestsFactory } = require('./createBulkUserRolesRequests')

describe('change user roles in bulk', () => {
  const newRequest = createBulkUserRolesRequestsFactory({})
  const render = jest.fn()
  const req = {
    session: {
      bulkUserRoles: {},
    },
  }
  const resp = { render }

  beforeEach(() => {
    jest.clearAllMocks()
    req.session.bulkUserRoles = {}
  })

  describe('start new request', () => {
    it('start new request returns the expected page', async () => {
      await newRequest.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: {} })
    })

    it('start new request sets session.bulkUserRoles object if not present', async () => {
      req.session.bulkUserRoles = undefined
      await newRequest.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: {} })
    })

    it('start new request passes existing session.bulkUserRoles object if present', async () => {
      req.session.bulkUserRoles = { jiraReference: '12345' }
      await newRequest.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: { jiraReference: '12345' } })
    })
  })
})
