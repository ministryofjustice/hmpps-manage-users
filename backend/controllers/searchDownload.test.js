const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { auditAction } = require('../utils/testUtils')
const { ManageUsersEvent } = require('../audit')
const { downloadFactory, downloadFactoryBetaSearch } = require('./searchDownload')

describe('download factory', () => {
  const searchApi = jest.fn()
  const json2csv = jest.fn()
  const allowDownload = jest.fn()

  beforeEach(() => {
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
    jest.clearAllMocks()
  })

  const mockSearchCall = () => {
    searchApi.mockResolvedValue([
      {
        username: 'BOB',
        firstName: 'Billy',
        lastName: 'Bob',
        email: 'bob@digital.justice.gov.uk',
        enabled: true,
        verified: true,
      },
      {
        username: 'FRED@DIGITAL.JUSTICE.GOV.UK',
        firstName: 'Billy',
        lastName: 'Fred',
        email: 'fred@digital.justice.gov.uk',
        enabled: true,
        verified: true,
      },
      {
        username: 'noemail',
        firstName: 'No',
        lastName: 'Email',
        enabled: true,
        verified: true,
      },
      {
        username: 'blankemail',
        firstName: 'Blank',
        lastName: 'Email',
        email: '',
        enabled: true,
        verified: true,
      },
    ])
  }
  const mockJson2Csv = () => {
    json2csv.mockReturnValue(
      `username,firstName,lastName,email,enabled,verified
       FRED@DIGITAL.JUSTICE.GOV.UK,Billy,Fred,fred@digital.justice.gov.uk,true,true
       noemail,No,Email,true,true
       blankemail,Blank,Email,,true,true`,
    )
  }
  const mockJson2CsvError = () => {
    json2csv.mockImplementation(() => {
      throw new Error('some error')
    })
  }
  const session = { userDetails: { username: 'username' } }

  describe('Download CSV', () => {
    const download = downloadFactory(searchApi, json2csv, allowDownload)

    it('should call external search api', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session,
      }
      const locals = {}
      mockSearchCall()
      mockJson2Csv()
      allowDownload.mockReturnValue(true)
      await download.downloadResults(req, {
        locals,
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(),
      })

      expect(searchApi).toHaveBeenCalledWith({
        locals,
        user: 'joe',
        roleCode: '',
        groupCode: '',
        status: 'ACTIVE',
        pageNumber: 0,
        pageSize: 20000,
        pageOffset: 0,
      })

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT))
    })

    it('should call external search api with all non-page related query parameters', async () => {
      const req = {
        query: {
          whatever: 'what',
          something: 'some',
          somethingElse: 'else',
          andAnotherThing: 'ANOTHER',
        },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session,
      }
      const locals = {}
      mockSearchCall()
      mockJson2Csv()
      allowDownload.mockReturnValue(true)
      await download.downloadResults(req, {
        locals,
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(),
      })

      expect(searchApi).toHaveBeenCalledWith({
        locals,
        whatever: 'what',
        something: 'some',
        somethingElse: 'else',
        andAnotherThing: 'ANOTHER',
        pageNumber: 0,
        pageSize: 20000,
        pageOffset: 0,
      })

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT))
    })

    it('should return the csv', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session,
      }
      const res = {
        locals: { user: { maintainAccessAdmin: true } },
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(),
      }
      mockSearchCall()
      mockJson2Csv()
      allowDownload.mockReturnValue(true)
      await download.downloadResults(req, res)

      expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
      expect(res.attachment).toHaveBeenCalledWith('user-search.csv')
      expect(res.send).toHaveBeenCalledWith(expect.any(String))

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT))
    })

    it('should return an error if not authorised', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session,
      }
      const res = {
        locals: {},
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(),
      }
      mockSearchCall()
      mockJson2Csv()
      allowDownload.mockReturnValue(false)

      await download.downloadResults(req, res)

      expect(res.writeHead).toHaveBeenCalledWith(403, { 'Content-Type': 'text/plain' })
      expect(res.end).toHaveBeenCalledWith(expect.any(String))

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DOWNLOAD_REPORT_FAILURE))
    })

    it('should return in error', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session,
      }
      const res = {
        locals: { user: { maintainAccessAdmin: true } },
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(),
      }
      mockSearchCall()
      mockJson2CsvError()
      allowDownload.mockReturnValue(true)
      await download.downloadResults(req, res)

      expect(res.writeHead).toHaveBeenCalledWith(500, { 'Content-Type': 'text/plain' })
      expect(res.end).toHaveBeenCalledWith(expect.any(String))

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DOWNLOAD_REPORT_FAILURE))
    })
  })
})

describe('download beta search factory', () => {
  const findUsersApi = jest.fn()
  const json2csv = jest.fn()
  const allowDownload = jest.fn()
  beforeEach(() => {
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
    jest.clearAllMocks()
  })

  const mockBetaSearchCall = () => {
    findUsersApi.mockResolvedValue([
      {
        username: 'Andy',
        firstName: 'Billy',
        lastName: 'Bob',
        email: 'bob@digital.justice.gov.uk',
        activeCaseload: {
          id: 'BAI',
          name: 'Belmarsg (HMP)',
        },
        dpsRoleCount: 1,
        expired: false,
        status: 'OPEN',
        locked: false,
        staffId: 1,
      },
      {
        username: 'FRED@DIGITAL.JUSTICE.GOV.UK',
        firstName: 'Billy',
        lastName: 'Fred',
        email: 'fred@digital.justice.gov.uk',
        activeCaseload: {
          id: 'BAI',
          name: 'Belmarsg (HMP)',
        },
        expired: true,
        status: 'EXPIRED_GRACE',
        locked: false,
        dpsRoleCount: 2,
        staffId: 2,
      },
      {
        username: 'noemail',
        firstName: 'No',
        lastName: 'Email',
        staffId: 3,
        expired: true,
        status: 'LOCKED_EXPIRED',
        locked: true,
      },
      {
        username: 'blankemail',
        firstName: 'Blank',
        lastName: 'Email',
        email: '',
        activeCaseload: {
          id: 'BAI',
          name: 'Belmarsg (HMP)',
        },
        dpsRoleCount: 4,
        expired: false,
        status: 'LOCKED',
        locked: true,
        staffId: 4,
      },
    ])
  }
  const mockJson2Csv = () => {
    json2csv.mockReturnValue(
      `staffId,username,firstName,lastName,email,dpsRoleCount,active,activeCaseload.id,expired,locked,accountStatus
      1,Andy,Billy,Bob,bob@digital.justice.gov.uk,1,1,BAI,false,false,OPEN
      2,FRED@DIGITAL.JUSTICE.GOV.UK,Billy,Fred,fred@digital.justice.gov.uk2,2,BAI,true,false,EXPIRED_GRACE
      3,noemail,No,Email,,,,,,true,true,LOCKED_EXPIRED
      4,blankemail,Blank,Email,,4,4,BAI,false,true,LOCKED`,
    )
  }

  const session = { userDetails: { username: 'username' } }

  describe('Download CSV from Beta Search', () => {
    const download = downloadFactoryBetaSearch(findUsersApi, json2csv, allowDownload)

    it('should call users api', async () => {
      const standardReq = {
        flash: jest.fn(),
        query: {},
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session,
      }
      const req = {
        ...standardReq,
        query: {
          user: 'Andy',
          status: 'INACTIVE',
          groupCode: 'MDI',
          roleCode: 'ACCESS_ROLE_ADMIN',
          restrictToActiveGroup: 'false',
        },
      }
      const locals = { user: { maintainAccessAdmin: true } }
      mockBetaSearchCall()
      mockJson2Csv()
      allowDownload.mockReturnValue(true)
      await download.downloadBetaResults(req, {
        locals,
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(),
      })

      expect(findUsersApi).toHaveBeenCalledWith({
        locals,
        user: 'Andy',
        accessRoles: ['ACCESS_ROLE_ADMIN'],
        caseload: 'MDI',
        activeCaseload: undefined,
        status: 'INACTIVE',
        size: undefined,
      })
    })
    it('should return the csv', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session,
      }
      const res = {
        locals: { user: { maintainAccessAdmin: true } },
        header: jest.fn(),
        attachment: jest.fn(),
        send: jest.fn(),
        writeHead: jest.fn(),
        end: jest.fn(),
      }
      mockBetaSearchCall()
      mockJson2Csv()
      allowDownload.mockReturnValue(true)
      await download.downloadBetaResults(req, res)

      expect(res.header).toHaveBeenCalledWith('Content-Type', 'text/csv')
      expect(res.attachment).toHaveBeenCalledWith('user-search.csv')
      expect(res.send).toHaveBeenCalledWith(expect.any(String))

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.DOWNLOAD_REPORT_ATTEMPT))
    })
  })
})
