const { menuFactory } = require('./menu')

describe('menu factory', () => {
  const logError = jest.fn()
  const menu = menuFactory(logError)

  describe('index', () => {
    it('should call menu render', () => {
      const render = jest.fn()
      menu.index({}, { render })
      expect(render).toBeCalledWith('menu.njk')
    })

    it('should call error on render failure', () => {
      const render = jest.fn()
      render.mockImplementation(() => throw new Error('This failed'))
      menu.index({}, { render })
      expect(render.mock.calls).toEqual([['menu.njk'], ['error.njk', { url: '/menu' }]])
    })
  })
})
