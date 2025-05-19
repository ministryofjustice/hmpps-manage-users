const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { createExternalUserFactory } = require('./createExternalUser')
const { ManageUsersEvent } = require('../audit')
const { auditAction } = require('../utils/testUtils')

describe('create user factory', () => {
  const getAssignableGroupsApi = jest.fn()
  const createExternalUserApi = jest.fn()
  const createExternalUser = createExternalUserFactory(
    getAssignableGroupsApi,
    createExternalUserApi,
    '/create-external-users',
    '/search-external-users',
    '/manage-external-users',
    'Search for an external user',
  )

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call create user render', async () => {
      const req = { params: {}, flash: jest.fn() }
      getAssignableGroupsApi.mockResolvedValue([{ groupName: 'name', groupCode: 'code' }])

      const render = jest.fn()
      await createExternalUser.index(req, { render })
      expect(render).toBeCalledWith('createExternalUser.njk', {
        maintainTitle: 'Search for an external user',
        maintainUrl: '/create-external-users',
        groupDropdownValues: [{ selected: false, text: 'name', value: 'code' }],
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: {}, flash: jest.fn().mockReturnValue({ error: 'some error' }) }
      getAssignableGroupsApi.mockResolvedValue([{ groupName: 'name', groupCode: 'code' }])

      const render = jest.fn()
      await createExternalUser.index(req, { render })
      expect(render).toBeCalledWith('createExternalUser.njk', {
        errors: { error: 'some error' },
        maintainTitle: 'Search for an external user',
        maintainUrl: '/create-external-users',
        groupDropdownValues: [{ selected: false, text: 'name', value: 'code' }],
      })
    })
  })

  describe('post', () => {
    const session = { userDetails: { username: 'username' } }
    it('should create user and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {
          email: 'bob@digital.justice.gov.uk',
          firstName: 'bob',
          lastName: 'smith',
          groupCode: 'SITE_1_GROUP_1',
        },
        flash: jest.fn(),
        session,
      }
      createExternalUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createExternalUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createExternalUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createExternalUserApi).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        firstName: 'bob',
        lastName: 'smith',
        groupCodes: ['SITE_1_GROUP_1'],
      })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
        action: ManageUsersEvent.CREATE_USER_ATTEMPT,
        details:
          '{"authSource":"external","user":{"email":"bob@digital.justice.gov.uk","firstName":"bob","lastName":"smith","groupCode":"SITE_1_GROUP_1"}}',
        subjectId: null,
        subjectType: null,
        who: 'username',
        service: 'hmpps-manage-users',
        correlationId: expect.any(String),
      })
    })

    it('should trim fields, create user and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {
          email: ' bob@digital.justice.gov.uk ',
          firstName: ' bob ',
          lastName: ' smith ',
          groupCode: 'SITE_1_GROUP_1',
        },
        flash: jest.fn(),
        session,
      }
      createExternalUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createExternalUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createExternalUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createExternalUserApi).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        firstName: 'bob',
        lastName: 'smith',
        groupCodes: ['SITE_1_GROUP_1'],
      })
    })

    it('should create user without group and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {
          email: 'bob@digital.justice.gov.uk',
          firstName: 'bob',
          lastName: 'smith',
          groupCode: '',
        },
        flash: jest.fn(),
        session,
      }

      createExternalUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createExternalUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createExternalUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createExternalUserApi).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        firstName: 'bob',
        lastName: 'smith',
        groupCodes: undefined,
      })
    })

    it('should stash away the search results url in the session', async () => {
      const req = {
        params: {},
        body: {
          email: 'bob@digital.justice.gov.uk',
          firstName: 'bob',
          lastName: 'smith',
          groupCode: '',
        },
        flash: jest.fn(),
        session,
      }

      const render = jest.fn()
      const locals = jest.fn()
      await createExternalUser.post(req, { render, locals })
      expect(req.session).toEqual({
        searchUrl: '/search-external-users',
        searchResultsUrl: '/search-external-users?user=bob%40digital.justice.gov.uk',
        userDetails: { username: 'username' },
      })
    })

    it('should stash the errors and redirect if no details entered', async () => {
      const req = { params: {}, body: {}, flash: jest.fn(), originalUrl: '/original', session }

      const redirect = jest.fn()
      await createExternalUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createExternalUserErrors', [
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
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_USER_FAILURE))
    })

    it('should fail gracefully if email not valid', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }

      createExternalUserApi.mockRejectedValue(error)
      const req = {
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await createExternalUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createExternalUserErrors', [
        {
          href: '#firstName',
          text: 'Enter a first name',
        },
        {
          href: '#lastName',
          text: 'Enter a last name',
        },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_USER_FAILURE))
    })

    it('should fail gracefully if email already exists', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { error_description: 'Email already exists' } },
      }

      createExternalUserApi.mockRejectedValue(error)
      const req = {
        params: {},
        body: {
          email: 'bob@digital.justice.gov.uk',
          firstName: 'bob',
          lastName: 'smith',
          groupCode: 'SITE_1_GROUP_1',
        },
        flash: jest.fn(),
        originalUrl: '/some-location',
        session,
      }
      await createExternalUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createExternalUserErrors', [
        {
          href: '#email',
          text: 'Email already exists',
        },
      ])
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_USER_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.CREATE_USER_FAILURE))
    })
  })
})
