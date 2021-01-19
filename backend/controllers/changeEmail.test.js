const { changeEmailFactory } = require('./changeEmail')

const createError = ({ status = 400, errorCode = 'email.somethingelse' }) => {
  const error = new Error('This failed')
  // @ts-ignore
  error.status = status
  // @ts-ignore
  error.response = { body: { error_description: 'not valid', error: errorCode } }
  return error
}

describe('change email factory', () => {
  const getUserApi = jest.fn()
  const saveEmail = jest.fn()
  const changeEmail = changeEmailFactory(getUserApi, saveEmail, '/maintain-external-users', '/manage-external-users')

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
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/joe/details',
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
        staff: { name: 'Billy Bob', username: 'BOB' },
        currentEmail: 'bob@digital.justice.gov.uk',
        staffUrl: '/manage-external-users/joe/details',
      })
    })
  })

  describe('post', () => {
    it('should change the email and redirect', async () => {
      const req = { params: { username: 'joe' }, body: { email: 'bob@digital.justice.gov.uk' }, flash: jest.fn() }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeEmail.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/joe/details')
      expect(saveEmail).toBeCalledWith(locals, 'joe', 'bob@digital.justice.gov.uk')
    })

    it('should trim, change the email and redirect', async () => {
      const req = { params: { username: 'joe' }, body: { email: ' bob@digital.justice.gov.uk ' }, flash: jest.fn() }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeEmail.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-external-users/joe/details')
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

    it('should fail gracefully if email not valid', async () => {
      const redirect = jest.fn()
      const error = createError({})

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

    it('should display work email message if email domain not valid', async () => {
      const redirect = jest.fn()
      const error = createError({ errorCode: 'email.domain' })

      saveEmail.mockRejectedValue(error)
      const req = {
        params: { username: 'joe' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeEmail.post(req, { redirect })
      expect(req.flash).toBeCalledWith('changeEmailErrors', [
        {
          href: '#email',
          text: 'The email domain is not allowed.  Enter a work email address',
        },
      ])
    })

    it('should display duplicate email message if email already taken', async () => {
      const redirect = jest.fn()
      const error = createError({ errorCode: 'email.duplicate' })

      saveEmail.mockRejectedValue(error)
      const req = {
        params: { username: 'joe' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeEmail.post(req, { redirect })
      expect(req.flash).toBeCalledWith('changeEmailErrors', [
        {
          href: '#email',
          text: 'This email address is already assigned to a different user',
        },
      ])
    })

    it('should display default error message on client error', async () => {
      const redirect = jest.fn()
      const error = createError({})

      saveEmail.mockRejectedValue(error)
      const req = {
        params: { username: 'joe' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await changeEmail.post(req, { redirect })
      expect(req.flash).toBeCalledWith('changeEmailErrors', [
        {
          href: '#email',
          text: 'not valid',
        },
      ])
    })
  })
})
