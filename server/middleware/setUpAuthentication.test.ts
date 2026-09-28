import { sameOriginReturnPath } from './setUpAuthentication'

describe('sameOriginReturnPath', () => {
  const ingressUrl = 'https://manage-users.hmpps.service.justice.gov.uk'

  it('returns the path, query and hash for a same-origin referer', () => {
    expect(sameOriginReturnPath(`${ingressUrl}/some/page?foo=bar#section`, ingressUrl)).toBe(
      '/some/page?foo=bar#section',
    )
  })

  it('returns just the path for a same-origin referer with no query or hash', () => {
    expect(sameOriginReturnPath(`${ingressUrl}/some/page`, ingressUrl)).toBe('/some/page')
  })

  it('falls back to / for a cross-origin referer (open redirect attempt)', () => {
    expect(sameOriginReturnPath('https://evil.example.com/phishing', ingressUrl)).toBe('/')
  })

  it('falls back to / for a same-path but different-scheme/host referer', () => {
    expect(sameOriginReturnPath('http://manage-users.hmpps.service.justice.gov.uk/some/page', ingressUrl)).toBe('/')
  })

  it('falls back to / when no referer is provided', () => {
    expect(sameOriginReturnPath(undefined, ingressUrl)).toBe('/')
  })

  it('falls back to / for an empty referer', () => {
    expect(sameOriginReturnPath('', ingressUrl)).toBe('/')
  })

  it('falls back to / for a malformed referer', () => {
    expect(sameOriginReturnPath('not-a-url', ingressUrl)).toBe('/')
  })
})
