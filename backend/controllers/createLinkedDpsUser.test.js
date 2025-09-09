const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { createLinkedDpsUserFactory } = require('./createLinkedDpsUser')
const { ManageUsersEvent, ManageUsersSubjectType } = require('../audit')
const { auditAction } = require('../utils/testUtils')

describe('create linked user factory', () => {
  const session = { userDetails: { username: 'username' } }

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  const getCaseloads = jest.fn()
  const createLinkedAdminUser = jest.fn()
  const createLinkedLsaUser = jest.fn()
  const createLinkedGeneralUser = jest.fn()
  const searchUser = jest.fn()

  const createLinkedDpsUser = createLinkedDpsUserFactory(
    getCaseloads,
    createLinkedAdminUser,
    createLinkedLsaUser,
    createLinkedGeneralUser,
    searchUser,
    '/create-linked-dps-user',
    '/create-dps-user',
    '/create-user',
    '/manage-dps-users',
  )

  describe('index', () => {
    it('should redirect to create-user page when no user but search param is set e.g. using browser back button from create linked user page  ', async () => {
      const req = {
        query: { action: 'searchUser' },
        flash: jest.fn().mockReturnValueOnce(''),
      }
      const render = jest.fn()
      const redirect = jest.fn()
      await createLinkedDpsUser.index(req, { render, redirect })

      expect(req.flash).toHaveBeenCalledWith('user')
      expect(redirect).toHaveBeenCalledWith('/create-linked-dps-user')
    })

    it('should redirect to create-user page when no user or user type is defined in request e.g. using browser back button from create linked user page  ', async () => {
      const req = {
        query: { action: '' },
        flash: jest.fn().mockReturnValueOnce(''),
      }
      const render = jest.fn()
      const redirect = jest.fn()
      await createLinkedDpsUser.index(req, { render, redirect })

      expect(req.flash).toHaveBeenCalledWith('user')
      expect(redirect).toHaveBeenCalledWith('/create-user')
    })

    it('should display link general user page, when general user type with link option is selected on preceeding pages', async () => {
      const req = {
        params: {},
        flash: jest.fn().mockReturnValueOnce([{ userType: 'DPS_GEN', userExists: 'true' }]),
      }
      getCaseloads.mockResolvedValue([{ id: 'MDI', name: 'Moorland HMP' }])

      const render = jest.fn()
      const redirect = jest.fn()
      await createLinkedDpsUser.index(req, { render, redirect })

      expect(req.flash).toHaveBeenCalledWith('user')
      expect(req.flash).toHaveBeenCalledWith('createDpsUserErrors')
      expect(render).toHaveBeenCalledWith('createDpsLinkedGeneralUser.njk', {
        title: 'Create a Linked DPS General user',
        userType: 'DPS_GEN',
        caseloadTitle: 'Select a default caseload',
        showCaseloadDropdown: true,
        userExists: 'true',
        caseloadDropdownValues: [{ text: 'Moorland HMP', value: 'MDI' }],
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: {},
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_GEN', userExists: 'true' }])
          .mockReturnValueOnce({ error: 'some error' }),
      }
      getCaseloads.mockResolvedValue([{ id: 'MDI', name: 'Moorland HMP' }])

      const redirect = jest.fn()
      const render = jest.fn()
      await createLinkedDpsUser.index(req, { render, redirect })
      expect(render).toHaveBeenCalledWith('createDpsLinkedGeneralUser.njk', {
        errors: { error: 'some error' },
        title: 'Create a Linked DPS General user',
        userType: 'DPS_GEN',
        userExists: 'true',
        caseloadTitle: 'Select a default caseload',
        showCaseloadDropdown: true,
        caseloadDropdownValues: [{ text: 'Moorland HMP', value: 'MDI' }],
      })
    })
  })

  describe('post search', () => {
    it('search user by username', async () => {
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_ADM',
          userExists: 'true',
          userType: 'DPS_GEN',
          searchUser: 'DPS_GEN',
        },
        flash: jest.fn(),
        session,
      }
      searchUser.mockResolvedValue({
        email: 'bob@digital.justice.gov.uk',
        username: 'BOB_ADM',
        firstName: 'bob',
        lastName: 'smith',
      })
      getCaseloads.mockResolvedValue([{ id: 'MDI', name: 'Moorland HMP' }])
      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })
      expect(searchUser).toHaveBeenCalledWith(locals, req.body.existingUsername)

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT,
        details: JSON.stringify({ action: 'create-search', existingUsername: 'BOB_ADM' }),
        subjectId: 'BOB_ADM',
        subjectType: ManageUsersSubjectType.USER_ID,
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
      })
    })
  })

  describe('post create linked user', () => {
    it('should create General user and link to existing admin and redirect', async () => {
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_ADM',
          generalUsername: 'BOB_GEN',
          defaultCaseloadId: 'smith',
          userType: 'DPS_GEN',
          createUser: 'create-gen',
        },
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_GEN' }])
          .mockReturnValueOnce({ error: 'some error' }),
        session,
      }
      createLinkedGeneralUser.mockResolvedValue({ generalAccount: { username: 'BOB_GEN' } })

      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })

      expect(createLinkedGeneralUser).toHaveBeenCalledWith(locals, {
        existingAdminUsername: 'BOB_ADM',
        generalUsername: 'BOB_GEN',
        defaultCaseloadId: 'smith',
      })
      expect(render).toHaveBeenCalledWith('createLinkedDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_GEN/details',
      })

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT,
        details: JSON.stringify({ action: 'create-gen', existingUsername: 'BOB_ADM', generalUsername: 'BOB_GEN' }),
        subjectId: 'BOB_ADM',
        subjectType: ManageUsersSubjectType.USER_ID,
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
      })
    })

    it('should create Admin user and link to general user and redirect', async () => {
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_GEN',
          adminUsername: 'BOB_ADM',
          userType: 'DPS_ADM',
          createUser: 'create-admin',
        },
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_ADM' }])
          .mockReturnValueOnce({ error: 'some error' }),
        session,
      }
      createLinkedAdminUser.mockResolvedValue({ adminAccount: { username: 'BOB_ADM' } })

      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })

      expect(createLinkedAdminUser).toHaveBeenCalledWith(locals, {
        existingUsername: 'BOB_GEN',
        adminUsername: 'BOB_ADM',
      })
      expect(render).toHaveBeenCalledWith('createLinkedDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_ADM/details',
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT,
        details: JSON.stringify({ action: 'create-admin', existingUsername: 'BOB_GEN', adminUsername: 'BOB_ADM' }),
        subjectId: 'BOB_GEN',
        subjectType: ManageUsersSubjectType.USER_ID,
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
      })
    })

    it('should create an LSA user and link to general user and redirect', async () => {
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_GEN',
          adminUsername: 'BOB_LSA',
          defaultCaseloadId: 'smith',
          userType: 'DPS_LSA',
          createUser: 'create-lsa',
        },
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_LSA' }])
          .mockReturnValueOnce({ error: 'some error' }),
        session,
      }
      createLinkedLsaUser.mockResolvedValue({ adminAccount: { username: 'BOB_LSA' } })

      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })

      expect(createLinkedLsaUser).toHaveBeenCalledWith(locals, {
        existingUsername: 'BOB_GEN',
        adminUsername: 'BOB_LSA',
        localAdminGroup: 'smith',
      })
      expect(render).toHaveBeenCalledWith('createLinkedDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_LSA/details',
      })

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT,
        details: JSON.stringify({ action: 'create-lsa', existingUsername: 'BOB_GEN', adminUsername: 'BOB_LSA' }),
        subjectId: 'BOB_GEN',
        subjectType: ManageUsersSubjectType.USER_ID,
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
      })
    })

    it('should trim fields, create admin user and link to general user and redirect', async () => {
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_GEN  ',
          adminUsername: 'BOB_ADM  ',
          userType: 'DPS_ADM',
          createUser: 'create-admin',
        },
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_ADM' }])
          .mockReturnValueOnce({ error: 'some error' }),
        session,
      }
      createLinkedAdminUser.mockResolvedValue({ adminAccount: { username: 'BOB_ADM' } })

      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })

      expect(createLinkedAdminUser).toHaveBeenCalledWith(locals, {
        existingUsername: 'BOB_GEN',
        adminUsername: 'BOB_ADM',
      })
      expect(render).toHaveBeenCalledWith('createLinkedDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_ADM/details',
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT),
      )
    })

    it('should stash the errors and redirect if no details entered for admin to general user linking', async () => {
      const req = {
        params: {},
        body: {
          existingUsername: '',
          adminUsername: '',
          userType: 'DPS_ADM',
          createUser: 'create-admin',
        },
        flash: jest.fn(),
        session,
        originalUrl: '/original',
      }
      createLinkedAdminUser.mockResolvedValue({ adminAccount: { username: 'BOB_ADM' } })

      const render = jest.fn()
      const locals = jest.fn()
      const redirect = jest.fn()

      await createLinkedDpsUser.post(req, { render, locals, redirect })

      expect(redirect).toHaveBeenCalledWith('/original')
      expect(req.flash).toHaveBeenCalledWith('createDpsUserErrors', [
        {
          href: '#existingUsername',
          text: 'Enter the existing username',
        },
        {
          href: '#existingUsername',
          text: 'Existing Username must be 2 characters or more',
        },
        {
          href: '#adminUsername',
          text: 'Enter the Admin user name',
        },
        {
          href: '#adminUsername',
          text: 'Admin user name must be 2 characters or more',
        },
      ])

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT),
      )
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_FAILURE),
      )
    })

    it('should fail gracefully if a general error occurs', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 400,
        response: { body: { userMessage: 'something went wrong' } },
      }

      createLinkedAdminUser.mockRejectedValue(error)
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_GEN',
          adminUsername: 'BOB_ADM',
          userType: 'DPS_ADM',
          createUser: 'create-admin',
        },
        flash: jest.fn(),
        session,
        originalUrl: '/some-location',
      }
      await createLinkedDpsUser.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/some-location')
      expect(req.flash).toHaveBeenCalledWith('createDpsUserErrors', [
        {
          text: 'something went wrong',
        },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT),
      )
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_FAILURE),
      )
    })

    it('should fail gracefully if username already exists', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { errorCode: 409, userMessage: 'Username already exists' } },
      }

      createLinkedAdminUser.mockRejectedValue(error)
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_GEN',
          adminUsername: 'BOB_ADM',
          userType: 'DPS_ADM',
          createUser: 'create-admin',
        },
        flash: jest.fn(),
        session,
        originalUrl: '/some-location',
      }
      await createLinkedDpsUser.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/some-location')
      expect(req.flash).toHaveBeenCalledWith('createDpsUserErrors', [
        {
          href: '#adminUsername',
          text: 'Username already exists',
        },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT),
      )
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_FAILURE),
      )
    })

    it('should fail gracefully if username already linked', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: {
          body: { errorCode: 409, userMessage: 'User already exists: Admin user already exists for this staff member' },
        },
      }

      createLinkedAdminUser.mockRejectedValue(error)
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_GEN',
          adminUsername: 'BOB_ADM',
          userType: 'DPS_ADM',
          createUser: 'create-admin',
        },
        flash: jest.fn(),
        session,
        originalUrl: '/some-location',
      }
      await createLinkedDpsUser.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/some-location')
      expect(req.flash).toHaveBeenCalledWith('createDpsUserErrors', [
        {
          href: '#existingUsername',
          text: 'Username already linked to another account',
        },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT),
      )
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_FAILURE),
      )
    })

    it('should fail gracefully if the Username was not found', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 404,
        response: { body: { errorCode: 404, userMessage: 'Username not found' } },
      }

      createLinkedAdminUser.mockRejectedValue(error)
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_GEN',
          adminUsername: 'BOB_ADM',
          userType: 'DPS_ADM',
          createUser: 'create-admin',
        },
        flash: jest.fn(),
        session,
        originalUrl: '/some-location',
      }
      await createLinkedDpsUser.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/some-location')
      expect(req.flash).toHaveBeenCalledWith('createDpsUserErrors', [
        {
          href: '#existingUsername',
          text: 'Username not found',
        },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_ATTEMPT),
      )
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(
        auditAction(ManageUsersEvent.CREATE_LINKED_USER_FAILURE),
      )
    })
  })
})
