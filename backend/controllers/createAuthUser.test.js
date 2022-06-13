const { createAuthUserFactory } = require('./createAuthUser')

describe('create user factory', () => {
  const getAssignableGroupsApi = jest.fn()
  const createAuthUserApi = jest.fn()
  const createAuthUser = createAuthUserFactory(
    getAssignableGroupsApi,
    createAuthUserApi,
    '/create-external-users',
    '/search-external-users',
    '/manage-external-users',
    'Search for an external user',
  )

  describe('index', () => {
    it('should call create user render', async () => {
      const req = { params: {}, flash: jest.fn() }
      getAssignableGroupsApi.mockResolvedValue([{ groupName: 'name', groupCode: 'code' }])

      const render = jest.fn()
      await createAuthUser.index(req, { render })
      expect(render).toBeCalledWith('createAuthUser.njk', {
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
      await createAuthUser.index(req, { render })
      expect(render).toBeCalledWith('createAuthUser.njk', {
        errors: { error: 'some error' },
        maintainTitle: 'Search for an external user',
        maintainUrl: '/create-external-users',
        groupDropdownValues: [{ selected: false, text: 'name', value: 'code' }],
      })
    })
  })

  describe('post', () => {
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
        session: {},
      }
      createAuthUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createAuthUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createAuthUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createAuthUserApi).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        firstName: 'bob',
        lastName: 'smith',
        groupCode: 'SITE_1_GROUP_1',
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
        session: {},
      }
      createAuthUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createAuthUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createAuthUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createAuthUserApi).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        firstName: 'bob',
        lastName: 'smith',
        groupCode: 'SITE_1_GROUP_1',
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
        session: {},
      }

      createAuthUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createAuthUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createAuthUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createAuthUserApi).toBeCalledWith(locals, {
        email: 'bob@digital.justice.gov.uk',
        firstName: 'bob',
        lastName: 'smith',
        groupCode: '',
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
        session: {},
      }

      const render = jest.fn()
      const locals = jest.fn()
      await createAuthUser.post(req, { render, locals })
      expect(req.session).toEqual({
        searchUrl: '/search-external-users',
        searchResultsUrl: '/search-external-users/results?user=bob@digital.justice.gov.uk',
      })
    })

    it('should stash the errors and redirect if no details entered', async () => {
      const req = { params: {}, body: {}, flash: jest.fn(), originalUrl: '/original' }

      const redirect = jest.fn()
      await createAuthUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createAuthUserErrors', [
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
    })

    it('should fail gracefully if email not valid', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }

      createAuthUserApi.mockRejectedValue(error)
      const req = {
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await createAuthUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createAuthUserErrors', [
        {
          href: '#firstName',
          text: 'Enter a first name',
        },
        {
          href: '#lastName',
          text: 'Enter a last name',
        },
      ])
    })

    it('should fail gracefully if email already exists', async () => {
      const redirect = jest.fn()
      const error = {
        ...new Error('This failed'),
        status: 409,
        response: { body: { error_description: 'Email already exists' } },
      }

      createAuthUserApi.mockRejectedValue(error)
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
      }
      await createAuthUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createAuthUserErrors', [
        {
          href: '#email',
          text: 'Email already exists',
        },
      ])
    })
  })
})
