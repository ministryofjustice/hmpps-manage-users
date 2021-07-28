const { deactivateUserReasonFactory } = require('./deactivateUserReason')

describe('deactivate user reason factory', () => {
  const deactivateUserApi = jest.fn()
  const deactivateUser = deactivateUserReasonFactory(
    deactivateUserApi,
    '/manage-external-users',
    'Deactivate user reason',
  )

  describe('index', () => {
    it('should call deactivateUserReason render', async () => {
      const req = { params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }, flash: jest.fn() }
      const render = jest.fn()
      await deactivateUser.index(req, { render })
      expect(render).toBeCalledWith('userDeactivate.njk', {
        title: 'Deactivate user reason',
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        reason: null,
        errors: undefined,
      })
    })
    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
      }
      const render = jest.fn()
      await deactivateUser.index(req, { render })
      expect(render).toBeCalledWith('userDeactivate.njk', {
        errors: { error: 'some error' },
        title: 'Deactivate user reason',
        reason: null,
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })
  })

  describe('post', () => {
    it('should deactivate user and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { reason: 'Left' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await deactivateUser.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(deactivateUserApi).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'Left')
    })
  })

  it('should fail gracefully if group manager not allowed to maintain user', async () => {
    const redirect = jest.fn()
    const error = { ...new Error('This failed'), status: 403 }
    deactivateUserApi.mockRejectedValue(error)
    await deactivateUser.post(
      {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { group: 'GLOBAL_SEARCH' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      },
      { redirect },
    )
    expect(redirect).toBeCalledWith('/some-location')
  })
})
