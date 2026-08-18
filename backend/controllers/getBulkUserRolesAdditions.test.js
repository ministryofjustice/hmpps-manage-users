const EventEmitter = require('node:events')
const { getBulkUserRolesRequestsFactory } = require('./getBulkUserRolesAdditions')
const { ManageUsersEvent } = require('../audit')

describe('Bulk user roles additions', () => {
  const getAll = jest.fn()
  const getById = jest.fn()
  const getDownloadCsvStream = jest.fn()
  const render = jest.fn()

  const sendAudit = jest.fn().mockResolvedValue()
  const auditService = {
    audit: jest.fn(() => sendAudit),
  }

  const controller = getBulkUserRolesRequestsFactory(
    { getAll, getById, getDownloadCsvStream },
    auditService,
    ManageUsersEvent,
  )

  const req = {
    params: {
      id: '666',
    },
    session: {
      userDetails: {
        username: 'clint.eastwood',
      },
    },
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

  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('Get all bulk user roles additions', () => {
    it('should render results with default paging values if not specified in request', async () => {
      req.query.keyword = 'bob'
      getAll.mockResolvedValue(bulkRolesAdditionsSummary)

      await controller.getBulkUserRolesAdditions(req, resp)

      expect(getAll).toHaveBeenNthCalledWith(1, resp.locals, 0, 20, 'bob')
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequests.njk', {
        bulkUserRolesRequests: bulkRolesAdditionsSummary,
      })
    })

    it('should render results with specified paging values', async () => {
      req.query.keyword = 'Bailey'
      req.query.pageNumber = '1'
      req.query.pageSize = '5'

      getAll.mockResolvedValue(bulkRolesAdditionsSummary)

      await controller.getBulkUserRolesAdditions(req, resp)

      expect(getAll).toHaveBeenNthCalledWith(1, resp.locals, 1, 5, 'Bailey')
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequests.njk', {
        bulkUserRolesRequests: bulkRolesAdditionsSummary,
      })
    })

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

    it('should render details page when request successful', async () => {
      getById.mockResolvedValue(bulkUserRolesAdditionsDetails)

      await controller.getBulkUserRolesAdditionDetails(req, resp)

      expect(getById).toHaveBeenNthCalledWith(1, resp.locals, '666')
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequestDetails.njk', {
        details: bulkUserRolesAdditionsDetails,
      })
    })

    it('should render details page when request unsuccessful', async () => {
      getById.mockRejectedValue('not found')

      await controller.getBulkUserRolesAdditionDetails(req, resp)

      expect(getById).toHaveBeenNthCalledWith(1, resp.locals, '666')
      expect(render).toHaveBeenLastCalledWith('viewBulkUserRolesRequestDetails.njk', {
        getRequestDetailsError: 'not found',
      })
    })
  })

  describe('Get bulk user roles additions CSV download', () => {
    it('should successfully stream API response to response object', async () => {
      const stream = new EventEmitter()
      stream.pipe = jest.fn()

      getDownloadCsvStream.mockReturnValue(stream)

      const res = {
        locals: {},
        status: jest.fn().mockReturnThis(),
        set: jest.fn(),
      }

      await controller.getResultsCsvDownload(req, res, jest.fn())

      stream.emit('response', {
        statusCode: 200,
        headers: {
          'content-type': 'text/csv',
          'content-disposition': 'attachment; filename=bulk-roles-addititons-666.csv',
        },
        body: 'userId,roleId,status,reason\nuser_1,role_1,SUCCESS,\nuser_2,role_1,ERROR,already assigned\n',
      })

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=bulk-roles-addititons-666.csv',
      })
      expect(stream.pipe).toHaveBeenCalledWith(res)
      expect(auditService.audit).toHaveBeenNthCalledWith(1, 'clint.eastwood', { id: '666' })
      expect(sendAudit).toHaveBeenCalledTimes(1)
      expect(sendAudit).toHaveBeenNthCalledWith(1, ManageUsersEvent.BULK_USER_ROLES_ADDITION_DOWNLOAD_CSV_ATTEMPT)
    })

    it('should write error details to download json file when API response is 4xx or 5xx status', async () => {
      const stream = new EventEmitter()
      stream.pipe = jest.fn()

      getDownloadCsvStream.mockReturnValue(stream)

      const res = {
        locals: {},
        status: jest.fn().mockReturnThis(),
        set: jest.fn(),
      }

      await controller.getResultsCsvDownload(req, res, jest.fn())

      const upstream = new EventEmitter()
      upstream.statusCode = 500
      upstream.headers = { 'content-type': 'application/json' }

      stream.emit('response', upstream)
      upstream.emit('data', JSON.stringify({ message: 'Internal server error failed to generate csv download' }))
      upstream.emit('end')
      stream.emit('end')

      await new Promise((resolve) => {
        setImmediate(resolve)
      })

      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.set).toHaveBeenCalledWith({
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="bulk-roles-assignments-666-ERROR.json"',
      })
      expect(stream.pipe).toHaveBeenCalledWith(res)
      expect(auditService.audit).toHaveBeenNthCalledWith(1, 'clint.eastwood', { id: '666' })
      expect(sendAudit).toHaveBeenCalledTimes(2)
      expect(sendAudit).toHaveBeenNthCalledWith(1, ManageUsersEvent.BULK_USER_ROLES_ADDITION_DOWNLOAD_CSV_ATTEMPT)
      expect(sendAudit).toHaveBeenNthCalledWith(2, ManageUsersEvent.BULK_USER_ROLES_ADDITION_DOWNLOAD_CSV_FAILURE)
    })
  })
})
