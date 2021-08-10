const { downloadFactory } = require('./searchDownload')

describe('download factory', () => {
  const searchApi = jest.fn()
  const json2csv = jest.fn()
  const allowDownload = jest.fn()

  beforeEach(() => {
    searchApi.mockReset()
    json2csv.mockReset()
    allowDownload.mockReset()
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

  describe('Download CSV', () => {
    const download = downloadFactory(searchApi, json2csv, allowDownload)

    it('should call external search api', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session: {},
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

      expect(searchApi).toBeCalledWith({
        locals,
        user: 'joe',
        roleCode: '',
        groupCode: '',
        status: 'ACTIVE',
        pageNumber: 0,
        pageSize: 10000,
        pageOffset: 0,
      })
    })

    it('should call external search api with all non-page related query parameters', async () => {
      const req = {
        query: {
          whatever: 'what',
          something: 'some',
          somethingElse: 'else',
          andAnotherThing: 'ANOTHER',
          size: 100,
          page: 10,
          offset: 1,
        },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session: {},
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

      expect(searchApi).toBeCalledWith({
        locals,
        whatever: 'what',
        something: 'some',
        somethingElse: 'else',
        andAnotherThing: 'ANOTHER',
        pageNumber: 0,
        pageSize: 10000,
        pageOffset: 0,
      })
    })

    it('should return the csv', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session: {},
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

      expect(res.header).toBeCalledWith('Content-Type', 'text/csv')
      expect(res.attachment).toBeCalledWith('user-search.csv')
      expect(res.send).toBeCalledWith(expect.any(String))
    })

    it('should return an error if not authorised', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session: {},
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
      await download.downloadResults(req, res)

      expect(res.writeHead).toBeCalledWith(403, { 'Content-Type': 'text/plain' })
      expect(res.end).toBeCalledWith(expect.any(String))
    })

    it('should return in error', async () => {
      const req = {
        query: { user: 'joe', groupCode: '', roleCode: '', status: 'ACTIVE' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
        protocol: 'http',
        originalUrl: '/',
        session: {},
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

      expect(res.writeHead).toBeCalledWith(500, { 'Content-Type': 'text/plain' })
      expect(res.end).toBeCalledWith(expect.any(String))
    })
  })
})
