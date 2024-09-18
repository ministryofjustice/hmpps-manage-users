const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { createDpsUserFactory } = require('./createDpsUser')
const { ManageUsersEvent } = require('../audit')
const config = require('../config')
const { auditAction } = require('../utils/testUtils')

describe('create user factory', () => {
  const getCaseloads = jest.fn()
  const createUser = jest.fn()
  const createDpsUser = createDpsUserFactory(getCaseloads, createUser, '/create-user', '/manage-dps-users')

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call create user render', async () => {
      const req = {
        params: {},
        flash: jest.fn().mockReturnValueOnce([{ userType: 'DPS_GEN' }]),
      }
      getCaseloads.mockResolvedValue([{ id: 'MDI', name: 'Moorland HMP' }])

      const render = jest.fn()
      const redirect = jest.fn()
      await createDpsUser.index(req, { render, redirect })

      expect(req.flash).toBeCalledWith('user')
      expect(req.flash).toBeCalledWith('createDpsUserErrors')
      expect(render).toBeCalledWith('createDpsUser.njk', {
        title: 'Create a DPS General user',
        userType: 'DPS_GEN',
        caseloadTitle: 'Select a default caseload',
        showCaseloadDropdown: true,
        caseloadDropdownValues: [{ text: 'Moorland HMP', value: 'MDI' }],
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: {},
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_GEN' }])
          .mockReturnValueOnce({ error: 'some error' }),
      }
      getCaseloads.mockResolvedValue([{ id: 'MDI', name: 'Moorland HMP' }])

      const redirect = jest.fn()
      const render = jest.fn()
      await createDpsUser.index(req, { render, redirect })
      expect(render).toBeCalledWith('createDpsUser.njk', {
        errors: { error: 'some error' },
        title: 'Create a DPS General user',
        userType: 'DPS_GEN',
        caseloadTitle: 'Select a default caseload',
        showCaseloadDropdown: true,
        caseloadDropdownValues: [{ text: 'Moorland HMP', value: 'MDI' }],
      })
    })
  })

  describe('post', () => {
    const username = 'username'
    const session = { userDetails: { username } }
    it('should create user and redirect', async () => {
      const req = {
        params: {},
        body: {
          email: 'bob@digital.justice.gov.uk',
          username: 'BOB_ADM',
          firstName: 'bob',
          lastName: 'smith',
          userType: 'DPS_GEN',
          defaultCaseloadId: 'MDI',
        },
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_GEN' }])
          .mockReturnValueOnce({ error: 'some error' }),
        session,
      }
      createUser.mockResolvedValue({ username: 'BOB_ADM', primaryEmail: 'bob@digital.justice.gov.uk' })

      const render = jest.fn()
      const locals = jest.fn()
      await createDpsUser.post(req, { render, locals })

      expect(createUser).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        username: 'BOB_ADM',
        firstName: 'bob',
        lastName: 'smith',
        defaultCaseloadId: 'MDI',
        userType: 'DPS_GEN',
      })
      expect(render).toBeCalledWith('createDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_ADM/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: ManageUsersEvent.CREATE_USER_ATTEMPT,
        details:
          '{"authSource":"nomis","user":{"email":"bob@digital.justice.gov.uk","username":"BOB_ADM","firstName":"bob","lastName":"smith","userType":"DPS_GEN","defaultCaseloadId":"MDI"}}',
        who: 'username',
        subjectId: null,
        subjectType: null,
        service: config.default.productId,
        correlationId: expect.any(String),
      })
    })

    it('should create user and redirect with forward apostrophe', async () => {
      const req = {
        params: {},
        body: {
          email: 'bob@digital.justice.gov.uk',
          username: 'BOB_OSHEA',
          firstName: 'O’Shea',
          lastName: 'O’Mark-Lewis',
          userType: 'DPS_GEN',
          defaultCaseloadId: 'MDI',
        },
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_GEN' }])
          .mockReturnValueOnce({ error: 'some error' }),
        session,
      }
      createUser.mockResolvedValue({ username: 'BOB_OSHEA', primaryEmail: 'bob@digital.justice.gov.uk' })

      const render = jest.fn()
      const locals = jest.fn()
      await createDpsUser.post(req, { render, locals })
      expect(createUser).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        username: 'BOB_OSHEA',
        firstName: "O'Shea",
        lastName: "O'Mark-Lewis",
        defaultCaseloadId: 'MDI',
        userType: 'DPS_GEN',
      })
      expect(render).toBeCalledWith('createDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_OSHEA/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
    })

    it('should trim fields, create user and redirect', async () => {
      const req = {
        params: { userId: 'BOB_ADM' },
        body: {
          email: ' bob@digital.justice.gov.uk ',
          username: ' BOB_ADM ',
          firstName: ' bob ',
          lastName: ' smith ',
          defaultCaseloadId: 'MDI',
          userType: 'DPS_GEN',
        },
        flash: jest.fn(),
        session,
      }

      createUser.mockResolvedValue({ username: 'BOB_ADM', primaryEmail: 'bob@digital.justice.gov.uk' })

      const render = jest.fn()
      const locals = jest.fn()
      await createDpsUser.post(req, { render, locals })

      expect(createUser).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        username: 'BOB_ADM',
        firstName: 'bob',
        lastName: 'smith',
        defaultCaseloadId: 'MDI',
        userType: 'DPS_GEN',
      })
      expect(render).toBeCalledWith('createDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_ADM/details',
        email: 'bob@digital.justice.gov.uk',
      })
    })

    it('should stash the errors and redirect if no details entered', async () => {
      const req = { params: {}, body: { userType: 'DPS_GEN' }, flash: jest.fn(), originalUrl: '/original', session }

      const redirect = jest.fn()
      await createDpsUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createDpsUserErrors', [
        {
          href: '#username',
          text: 'Enter a username',
        },
        {
          href: '#email',
          text: 'Enter an email address',
        },
        {
          href: '#firstName',
          text: 'Enter a first name',
        },
        {
          href: '#lastName',
          text: 'Enter a last name',
        },
        {
          href: '#defaultCaseloadId',
          text: 'Select a default caseload',
        },
      ])
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_FAILURE))
    })

    it('should show error if an email is invalid', async () => {
      const req = {
        params: {},
        body: {
          username: ' BOB_ADM ',
          email: ' invalidemail ',
          firstName: ' bob ',
          lastName: ' smith ',
          defaultCaseloadId: 'MDI',
          userType: 'DPS_GEN',
        },
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }

      const redirect = jest.fn()
      await createDpsUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createDpsUserErrors', [
        {
          href: '#email',
          text: 'Enter an email address in the correct format, like first.last@justice.gov.uk',
        },
      ])
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_FAILURE))
    })

    it('should fail gracefully if a general error occurs', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 400,
        response: { body: { userMessage: 'something went wrong' } },
      }

      createUser.mockRejectedValue(error)
      const req = {
        body: {
          email: 'bob@digital.justice.gov.uk',
          username: 'BOB_ADM',
          firstName: 'bob',
          lastName: 'smith',
          defaultCaseloadId: 'MDI',
          userType: 'DPS_GEN',
        },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await createDpsUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createDpsUserErrors', [
        {
          text: 'something went wrong',
        },
      ])
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_FAILURE))
    })

    it('should fail gracefully if username already exists', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { errorCode: 601, userMessage: 'Username already exists' } },
      }

      createUser.mockRejectedValue(error)
      const req = {
        params: {},
        body: {
          email: 'bob@digital.justice.gov.uk',
          username: 'BOB_ADM',
          firstName: 'bob',
          lastName: 'smith',
          defaultCaseloadId: 'MDI',
          userType: 'DPS_GEN',
        },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await createDpsUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createDpsUserErrors', [
        {
          href: '#username',
          text: 'Username already exists',
        },
      ])
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_FAILURE))
    })

    it('should fail gracefully if email domain is invalid', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { errorCode: 602, userMessage: 'Invalid Email domain' } },
      }

      createUser.mockRejectedValue(error)
      const req = {
        params: {},
        body: {
          email: 'bob@digital.justice.gov.uk',
          username: 'BOB_ADM',
          firstName: 'bob',
          lastName: 'smith',
          defaultCaseloadId: 'MDI',
          userType: 'DPS_GEN',
        },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await createDpsUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createDpsUserErrors', [
        {
          href: '#email',
          text: 'Invalid Email domain',
        },
      ])
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
      expect(auditService.sendAuditMessage).toBeCalledWith(auditAction(ManageUsersEvent.CREATE_USER_FAILURE))
    })
  })
})
