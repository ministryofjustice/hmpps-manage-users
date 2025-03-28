const { menuFactory } = require('./menu')

describe('menu factory', () => {
  const getNotificationMessage = jest.fn()
  const { index } = menuFactory(getNotificationMessage)

  describe('index', () => {
    it('should call menu render for DPS admin user with message', async () => {
      const locals = {
        user: { maintainAccess: true, maintainAccessAdmin: true },
        featureSwitches: { manageUserAllowList: { enabled: true } },
      }
      getNotificationMessage.mockResolvedValue({
        message: 'The Message',
      })
      const render = jest.fn()
      await index({}, { locals, render })
      expect(render).toBeCalledWith('menu.njk', { message: 'The Message' })
    })
  })

  it('should call menu render DPS LSA user with message', async () => {
    const locals = {
      user: { maintainAccess: true, maintainAccessAdmin: false },
      featureSwitches: { manageUserAllowList: { enabled: true } },
    }
    getNotificationMessage.mockResolvedValue({
      message: 'The Message',
    })
    const render = jest.fn()
    await index({}, { locals, render })
    expect(render).toBeCalledWith('menu.njk', { message: 'The Message' })
  })

  it('should call menu render for Auth Admin - no message', async () => {
    const locals = { user: { maintainAuthUsers: true }, featureSwitches: { manageUserAllowList: { enabled: true } } }

    const render = jest.fn()
    await index({}, { locals, render })
    expect(render).toBeCalledWith('menu.njk', { message: '' })
  })

  it('should call menu render with hasManageUserAllowList as true if feature enabled and correct role', async () => {
    const locals = {
      user: { manageUserAllowList: true },
      featureSwitches: { manageUserAllowList: { enabled: true } },
    }

    const render = jest.fn()
    await index({}, { locals, render })
    expect(render).toBeCalledWith('menu.njk', { message: '', hasManageUserAllowList: true })
  })

  it('should call menu render with hasManageUserAllowList as false if feature disabled and correct role', async () => {
    const locals = {
      user: { manageUserAllowList: true },
      featureSwitches: { manageUserAllowList: { enabled: false } },
    }

    const render = jest.fn()
    await index({}, { locals, render })
    expect(render).toBeCalledWith('menu.njk', { message: '', hasManageUserAllowList: false })
  })

  it('should call menu render with hasManageUserAllowList as false if feature enabled and incorrect role', async () => {
    const locals = {
      user: { manageUserAllowList: false },
      featureSwitches: { manageUserAllowList: { enabled: true } },
    }

    const render = jest.fn()
    await index({}, { locals, render })
    expect(render).toBeCalledWith('menu.njk', { message: '', hasManageUserAllowList: false })
  })

  it('should call menu render with hasManageUserAllowList as false if feature disabled and incorrect role', async () => {
    const locals = {
      user: { manageUserAllowList: false },
      featureSwitches: { manageUserAllowList: { enabled: false } },
    }

    const render = jest.fn()
    await index({}, { locals, render })
    expect(render).toBeCalledWith('menu.njk', { message: '', hasManageUserAllowList: false })
  })
})
