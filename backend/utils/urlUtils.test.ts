import cleanUpRedirect from './urlUtils'
import config from '../config'

const MALICIOUS_URL_ERROR_MESSAGE = 'Potential hack attempt detected: foreign redirect URL'
describe('cleanUpRedirect', () => {
  describe('stripping query parameters', () => {
    beforeEach(() => {
      config.app.host = 'expected-host.com'
    })
    it('removes query parameters from a URL with query params', () => {
      const result = cleanUpRedirect('https://expected-host.com/path?param=value')
      expect(result).toBe('https://expected-host.com/path')
    })

    it('returns the URL unchanged if no query parameters are present', () => {
      const result = cleanUpRedirect('https://expected-host.com/path')
      expect(result).toBe('https://expected-host.com/path')
    })

    it('handles URLs without a path or query parameters', () => {
      const result = cleanUpRedirect('https://expected-host.com')
      expect(result).toBe('https://expected-host.com')
    })
  })

  describe('host validation', () => {
    beforeEach(() => {
      config.app.host = 'expected-host.com'
    })
    it('throws an error if the URL has a different host', () => {
      shouldThrowErrorIfHostIsMalicious('https://malicious-host.com/path')
      shouldThrowErrorIfHostIsMalicious('http://malicious-host.com/path')
      shouldThrowErrorIfHostIsMalicious('https://malicious-host.com')
      shouldThrowErrorIfHostIsMalicious('malicious-host.com/path')
      shouldThrowErrorIfHostIsMalicious('www.malicious-host.com')
      shouldThrowErrorIfHostIsMalicious('malicious-host.com')

      function shouldThrowErrorIfHostIsMalicious(url: string) {
        expect(() => {
          cleanUpRedirect(url)
        }).toThrow(MALICIOUS_URL_ERROR_MESSAGE)
      }
    })

    it('does not throw an error if the host matches the expected host', () => {
      const result = cleanUpRedirect('https://expected-host.com/path')
      expect(result).toBe('https://expected-host.com/path')
    })

    it('handles relative paths and does not throw an error', () => {
      const result = cleanUpRedirect('/relative-path')
      expect(result).toBe('/relative-path')
    })

    it('throws an error for URLs without a protocol but with a different host', () => {
      expect(() => {
        cleanUpRedirect('malicious-host.com/path')
      }).toThrow(MALICIOUS_URL_ERROR_MESSAGE)
    })
  })

  describe('edge cases', () => {
    beforeEach(() => {
      config.app.host = 'expected-host.com'
    })
    it('throws an error if the ingress host is not defined', () => {
      config.app.host = ''
      expect(() => {
        cleanUpRedirect('https://expected-host.com/path')
      }).toThrow('Ingress host is not defined in the environment variables')
    })

    it('handles invalid URLs gracefully', () => {
      expect(() => {
        cleanUpRedirect('ht@://invalid-url')
      }).not.toThrow()
    })

    it('handles URLs without a protocol but matching the expected host', () => {
      const result = cleanUpRedirect('expected-host.com/path')
      expect(result).toBe('expected-host.com/path')
    })

    it('throws an error for URLs without a protocol but with a different host', () => {
      expect(() => {
        cleanUpRedirect('malicious-host.com/path')
      }).toThrow(MALICIOUS_URL_ERROR_MESSAGE)
    })
  })
})
