const { menuFactory } = require('./menu')

describe('menu factory', () => {
  const getNotificationMessage = jest.fn()
  const { index } = menuFactory(getNotificationMessage)

  describe('index', () => {
    it('should call menu render for DPS admin user with message', async () => {
      const locals = { user: { maintainAccess: true, maintainAccessAdmin: true } }
      getNotificationMessage.mockResolvedValue({
        message: 'The Message',
      })
      const render = jest.fn()
      await index({}, { locals, render })
      expect(render).toBeCalledWith('menu.njk', { message: 'The Message' })
    })
  })

  it('should call menu render DPS LSA user with message', async () => {
    const locals = { user: { maintainAccess: true, maintainAccessAdmin: false } }
    getNotificationMessage.mockResolvedValue({
      message: 'The Message',
    })
    const render = jest.fn()
    await index({}, { locals, render })
    expect(render).toBeCalledWith('menu.njk', { message: 'The Message' })
  })

  it('should call menu render for Auth Admin - no message', async () => {
    const locals = { user: { maintainAuthUsers: true } }

    const render = jest.fn()
    await index({}, { locals, render })
    expect(render).toBeCalledWith('menu.njk', { message: '' })
  })
})
