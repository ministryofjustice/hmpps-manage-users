const phaseNameSetup = require('./phaseNameSetup')

describe('phaseNameSetup', () => {
  it('will have a short phase version and colour for preproduction', () => {
    const app = {
      locals: {},
    }
    phaseNameSetup(app, { phaseName: 'PRE-PRODUCTION' })

    expect(app.locals.phaseName).toEqual('PRE-PRODUCTION')
    expect(app.locals.phaseNameShort).toEqual('PRE-PROD')
    expect(app.locals.phaseNameColour).toEqual('govuk-tag--green')
  })
  it('will have a same short phase version and no colour for dev', () => {
    const app = {
      locals: {},
    }
    phaseNameSetup(app, { phaseName: 'DEV' })

    expect(app.locals.phaseName).toEqual('DEV')
    expect(app.locals.phaseNameShort).toEqual('DEV')
    expect(app.locals.phaseNameColour).toEqual('')
  })
  it('will have a nothing when no phase supplied', () => {
    const app = {
      locals: {},
    }
    phaseNameSetup(app, { phaseName: '' })

    expect(app.locals.phaseName).toEqual('')
    expect(app.locals.phaseNameShort).toEqual('')
    expect(app.locals.phaseNameColour).toEqual('')
  })
})
