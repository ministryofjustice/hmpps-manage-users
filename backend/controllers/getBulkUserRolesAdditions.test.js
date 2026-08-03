const { getBulkUserRolesRequestsFactory } = require('./getBulkUserRolesAdditions')

describe('get bulk user roles additions', () => {
  const getAll = jest.fn()
  const getById = jest.fn()
  const render = jest.fn()
  const controller = getBulkUserRolesRequestsFactory({ getAll, getById })

  const req = {
    query: {
      keyword: '',
    },
  }
  const resp = { render, locals: {} }

  const bulkRolesAdditionsSummary = [
    {
      id: '1234567890',
      jiraReference: 'jira1234',
      status: 'PENDING',
      requestedBy: 'STEVE',
      requestDateTime: '2026-05-11T16:32:05',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Get bulk user roles additions', () => {
    it('should render results when API returns success result', async () => {
      req.query.keyword = 'bob'
      getAll.mockResolvedValue(bulkRolesAdditionsSummary)

      await controller.getBulkUserRolesAdditions(req, resp)

      expect(getAll).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequests.njk', {
        bulkUserRolesRequests: bulkRolesAdditionsSummary,
      })
    })

    it('should render results page with error message if API request unsuccessful', async () => {
      getAll.mockRejectedValue('get bulk user roles additions failed with error')

      await controller.getBulkUserRolesAdditions(req, resp)

      expect(getAll).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequests.njk', {
        getRequestsError: 'API responded with: get bulk user roles additions failed with error',
      })
    })

    it('should render empty results page when API return empty array', async () => {
      getAll.mockResolvedValue([])

      await controller.getBulkUserRolesAdditions(req, resp)

      expect(getAll).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequests.njk', { bulkUserRolesRequests: [] })
    })
  })

  describe('Get bulk user roles addition details', () => {
    const bulkUserRolesAdditionsDetails = {
      id: '1234567890',
      jiraReference: 'jira1234',
      status: 'PENDING',
      requestedBy: 'STEVE',
      requestDateTime: '2026-05-11T16:32:05',
      totalCount: 4,
      successCount: 3,
      errorCount: 1,
    }

    req.params = { id: '1234567890' }

    it('should render details page when request successful', async () => {
      getById.mockResolvedValue(bulkUserRolesAdditionsDetails)

      await controller.getBulkUserRolesAdditionDetails(req, resp)

      expect(getById).toHaveBeenNthCalledWith(1, resp.locals, '1234567890')
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequestDetails.njk', {
        details: bulkUserRolesAdditionsDetails,
      })
    })

    it('should render details page when request successful', async () => {
      getById.mockRejectedValue('not found')

      await controller.getBulkUserRolesAdditionDetails(req, resp)

      expect(getById).toHaveBeenNthCalledWith(1, resp.locals, '1234567890')
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequestDetails.njk', {
        getRequestDetailsError: 'not found',
      })
    })
  })
})
