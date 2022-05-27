const featureSwitches = require('./featureSwitches')

describe('Feature switches', () => {
  let req
  let res

  beforeEach(() => {
    req = {}
    res = { locals: {} }
  })

  it('should set switches into res.locals', async () => {
    const controller = featureSwitches({ featureSwitches: { dummySwitch: true } })
    controller(req, res, () => {})

    expect(res.locals.featureSwitches).toEqual({
      dummySwitch: true,
    })
  })
})
