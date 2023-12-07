const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { changeEmailFactory } = require('./changeEmail')

const createError = ({ status = 400, errorCode = 'email.somethingelse' }) => ({
  ...new Error('This failed'),
  status,
  response: { body: { error_description: 'not valid', error: errorCode } },
})

describe('change email factory', () => {
  const getUserApi = jest.fn()
  const saveEmail = jest.fn()
  const changeEmail = changeEmailFactory(getUserApi, saveEmail, '/manage-external-users')

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call changeEmail render', async () => {
      const req = { params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }, flash: jest.fn() }
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
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        currentEmail: 'bob@digital.justice.gov.uk',
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
      }
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
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })
  })

  describe('post', () => {
    const username = 'username'
    const session = { userDetails: { username } }
    it('should change the email and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeEmail.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith(
        '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/change-email-success',
      )
      expect(saveEmail).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'bob@digital.justice.gov.uk')
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: 'CHANGE_EMAIL_ADDRESS',
        details: '{"email":"bob@digital.justice.gov.uk"}',
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: 'USER_ID',
        who: 'username',
        service: 'hmpps-manage-users',
      })
    })

    it('should change the email and redirect to new email address', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeEmail.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith(
        '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/change-email-success',
      )
      expect(saveEmail).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'bob@digital.justice.gov.uk')
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: 'CHANGE_EMAIL_ADDRESS',
        details: '{"email":"bob@digital.justice.gov.uk"}',
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: 'USER_ID',
        who: 'username',
        service: 'hmpps-manage-users',
      })
    })

    it('should trim, change the email and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { email: ' bob@digital.justice.gov.uk ' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await changeEmail.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith(
        '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/change-email-success',
      )
      expect(saveEmail).toBeCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'bob@digital.justice.gov.uk')
      expect(req.flash).toBeCalledWith('changeEmail', 'bob@digital.justice.gov.uk')
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: 'CHANGE_EMAIL_ADDRESS',
        details: '{"email":"bob@digital.justice.gov.uk"}',
        subjectId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a',
        subjectType: 'USER_ID',
        who: 'username',
        service: 'hmpps-manage-users',
      })
    })

    it('should stash the errors and redirect if no email entered', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }

      const redirect = jest.fn()
      await changeEmail.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeEmailErrors', [{ href: '#email', text: 'Enter an email address' }])
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })

    it('should stash the email and redirect if no email entered', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }

      const redirect = jest.fn()
      await changeEmail.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('changeEmail', [undefined])
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })

    it('should fail gracefully if email not valid', async () => {
      const redirect = jest.fn()
      const error = createError({})

      saveEmail.mockRejectedValue(error)
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await changeEmail.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('changeEmail', ['bob@digital.justice.gov.uk'])
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })

    it('should display work email message if email domain not valid', async () => {
      const redirect = jest.fn()
      const error = createError({ errorCode: 'email.domain' })

      saveEmail.mockRejectedValue(error)
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await changeEmail.post(req, { redirect })
      expect(req.flash).toBeCalledWith('changeEmailErrors', [
        {
          href: '#email',
          text: 'The email domain is not allowed.  Enter a work email address',
        },
      ])
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })

    it('should display duplicate email message if email already taken', async () => {
      const redirect = jest.fn()
      const error = createError({ errorCode: 'email.duplicate' })

      saveEmail.mockRejectedValue(error)
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await changeEmail.post(req, { redirect })
      expect(req.flash).toBeCalledWith('changeEmailErrors', [
        {
          href: '#email',
          text: 'This email address is already assigned to a different user',
        },
      ])
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })

    it('should display default error message on client error', async () => {
      const redirect = jest.fn()
      const error = createError({})

      saveEmail.mockRejectedValue(error)
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await changeEmail.post(req, { redirect })
      expect(req.flash).toBeCalledWith('changeEmailErrors', [
        {
          href: '#email',
          text: 'not valid',
        },
      ])
      expect(auditService.sendAuditMessage).not.toHaveBeenCalled()
    })
  })

  describe('success', () => {
    it('should call changeEmailSuccess render', async () => {
      const req = { params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }, flash: jest.fn() }
      const render = jest.fn()
      req.flash.mockReturnValue('bob@digital.justice.gov.uk')
      getUserApi.mockResolvedValue({
        username: 'BOB',
        firstName: 'Billy',
        lastName: 'Bob',
        email: 'bob@digital.justice.gov.uk',
      })
      await changeEmail.success(req, { render })
      expect(render).toBeCalledWith('changeEmailSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
        usernameChanged: false,
      })
    })

    it('should call changeEmailSuccess render for username change', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn(),
      }
      const render = jest.fn()
      req.flash.mockReturnValue('bob@digital.justice.gov.uk')
      getUserApi.mockResolvedValue({
        username: 'bob@digital.justice.gov.uk',
        firstName: 'Billy',
        lastName: 'Bob',
        email: 'bob@digital.justice.gov.uk',
      })
      await changeEmail.success(req, { render })
      expect(render).toBeCalledWith('changeEmailSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
        usernameChanged: true,
      })
    })
  })
})
