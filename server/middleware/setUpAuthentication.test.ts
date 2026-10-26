import express from 'express'
import config from '../config'
import nunjucksSetup from '../utils/nunjucksSetup'
import setUpAuthentication, { sameOriginReturnPath } from './setUpAuthentication'

describe('switch account feature flag', () => {
  const originalFlag = config.featureSwitches.switchAccount.enabled

  afterEach(() => {
    config.featureSwitches.switchAccount.enabled = originalFlag
  })

  const hasSwitchAccountRoute = () => setUpAuthentication().stack.some(layer => layer.route?.path === '/switch-account')

  const renderHeader = (): Promise<string> => {
    const app = express()
    app.set('view engine', 'njk')
    nunjucksSetup(app)
    return new Promise((resolve, reject) => {
      app.render('partials/header.njk', { user: { displayName: 'First Last' } }, (err, html) =>
        err ? reject(err) : resolve(html),
      )
    })
  }

  it('registers the /switch-account endpoint and shows the menu item when enabled', async () => {
    config.featureSwitches.switchAccount.enabled = true

    expect(hasSwitchAccountRoute()).toBe(true)
    expect(await renderHeader()).toContain('data-qa="switchAccount"')
  })

  it('does not register the /switch-account endpoint or show the menu item when disabled', async () => {
    config.featureSwitches.switchAccount.enabled = false

    expect(hasSwitchAccountRoute()).toBe(false)
    expect(await renderHeader()).not.toContain('data-qa="switchAccount"')
  })
})

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

  it('should not allow a normalised path to become a scheme-relative URL', () => {
    expect(sameOriginReturnPath(`${ingressUrl}/.//evil.com`, ingressUrl)).toBe('/evil.com')
  })
})
