/* eslint-disable no-unused-expressions */
const errorStatusCode = require('../error-status-code').default

describe('Should translate errors', () => {
  describe('error has response', () => {
    it('should return status', () => {
      expect(errorStatusCode({ response: { status: 'code' } })).toEqual('code')
    })
    it('should ignore response if no status', () => {
      expect(errorStatusCode({ response: { joe: 'code' } })).toEqual(500)
    })
  })
  describe('error has code', () => {
    it('should return 503 if connection refused', () => {
      expect(errorStatusCode({ code: 'ECONNREFUSED' })).toEqual(503)
    })
    it('should ignore code if any other value', () => {
      expect(errorStatusCode({ code: 'code' })).toEqual(500)
    })
  })
  it('should return 500 for missing error', () => {
    expect(errorStatusCode()).toEqual(500)
  })
  it('should default to 500', () => {
    expect(errorStatusCode({ some: 'error' })).toEqual(500)
  })
})
