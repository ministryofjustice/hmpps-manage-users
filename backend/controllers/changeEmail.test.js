const { changeEmailFactory } = require('./changeEmail')

describe('change email factory', () => {
  const getUserApi = jest.fn()
  const saveEmail = jest.fn()
  const logError = jest.fn()
  const changeEmail = changeEmailFactory(
    getUserApi,
    saveEmail,
    '/maintain-external-users',
    '/manage-external-users',
    'Maintain external users',
    logError
  )

  describe('index', () => {
    it('should call changeEmail render', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn() }
      getUserApi.mockResolvedValue({
        username: 'BOB',
        firstName: 'Billy',
        lastName: 'Bob',
        email: 'bob@digital.justice.gov.uk',
      })

      const render = jest.fn()
      await changeEmail.index(req, { render })
      expect(render).toBeCalledWith('changeEmail.njk', {
        maintainTitle: 'Maintain external users',
        maintainUrl: '/maintain-external-users',
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/joe',
        currentEmail: 'bob@digital.justice.gov.uk',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: { username: 'joe' }, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getUserApi.mockResolvedValue({
        username: 'BOB',
        firstName: 'Billy',
        lastName: 'Bob',
        email: 'bob@digital.justice.gov.uk',
      })

      const render = jest.fn()
      await changeEmail.index(req, { render })
      expect(render).toBeCalledWith('changeEmail.njk', {
        errors: { error: 'some error' },
        maintainTitle: 'Maintain external users',
        maintainUrl: '/maintain-external-users',
        staff: { name: 'Billy Bob', username: 'BOB' },
        currentEmail: 'bob@digital.justice.gov.uk',
        staffUrl: '/manage-external-users/joe',
      })
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      getUserApi.mockRejectedValue(new Error('This failed'))
      await changeEmail.index({ params: { username: 'joe' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/manage-external-users/joe' })
    })
  })

  describe('post', () => {
    it('should change the email and redirect', async () => {
      const req = { params: { username: 'joe' }, body: { email: 'bob@digital.justice.gov.uk' }, flash: jest.fn() }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeEmail.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/joe')
      expect(saveEmail).toBeCalledWith(locals, 'joe', 'bob@digital.justice.gov.uk')
    })

    it('should stash the errors and redirect if no email entered', async () => {
      const req = { params: { username: 'joe' }, body: {}, flash: jest.fn(), originalUrl: '/original' }

      const redirect = jest.fn()
      await changeEmail.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeEmailErrors', [{ href: '#email', text: 'Enter an email address' }])
    })

    it('should stash the email and redirect if no email entered', async () => {
      const req = { params: { username: 'joe' }, body: {}, flash: jest.fn(), originalUrl: '/original' }

      const redirect = jest.fn()
      await changeEmail.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeEmail', [undefined])
    })

    it('should fail gracefully if email no valid', async () => {
      const redirect = jest.fn()
      const error = new Error('This failed')
      // @ts-ignore
      error.status = 400
      // @ts-ignore
      error.response = { body: { error_description: 'not valid' } }

      saveEmail.mockRejectedValue(error)
      const req = {
        params: { username: 'joe' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeEmail.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeEmail', ['bob@digital.justice.gov.uk'])
    })

    it('should call error on failure', async () => {
      const render = jest.fn()
      saveEmail.mockRejectedValue(new Error('This failed'))
      await changeEmail.post({ params: { username: 'joe' }, body: { email: 'bob@digital.justice.gov.uk' } }, { render })
      expect(render).toBeCalledWith('error.njk', { url: '/manage-external-users/joe/change-email' })
    })
  })
})
