const { menuFactory } = require('./menu')

describe('menu factory', () => {
  const menu = menuFactory()

  describe('index', () => {
    it('should call menu render', () => {
      const render = jest.fn()
      menu.index({}, { render })
      expect(render).toBeCalledWith('menu.njk')
    })
  })
})
