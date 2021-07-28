const { createUserFactory } = require('./createUser')

describe('create user factory', () => {
  const getAssignableGroupsApi = jest.fn()
  const createUserApi = jest.fn()
  const createUser = createUserFactory(
    getAssignableGroupsApi,
    createUserApi,
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
      await createUser.index(req, { render })
      expect(render).toBeCalledWith('createUser.njk', {
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
      await createUser.index(req, { render })
      expect(render).toBeCalledWith('createUser.njk', {
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
      createUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createUserApi).toBeCalledWith(locals, {
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
      createUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createUserApi).toBeCalledWith(locals, {
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

      createUserApi.mockResolvedValue('00000000-aaaa-0000-aaaa-0a0a0a0a0a0a')

      const render = jest.fn()
      const locals = jest.fn()
      await createUser.post(req, { render, locals })
      expect(render).toBeCalledWith('createUserSuccess.njk', {
        detailsLink: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
        email: 'bob@digital.justice.gov.uk',
      })
      expect(createUserApi).toBeCalledWith(locals, {
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
      await createUser.post(req, { render, locals })
      expect(req.session).toEqual({
        searchResultsUrl: '/search-external-users/results?user=bob@digital.justice.gov.uk',
      })
    })

    it('should stash the errors and redirect if no details entered', async () => {
      const req = { params: {}, body: {}, flash: jest.fn(), originalUrl: '/original' }

      const redirect = jest.fn()
      await createUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createUserErrors', [
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

    it('should fail gracefully if email no valid', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 400, response: { body: { error_description: 'not valid' } } }

      createUserApi.mockRejectedValue(error)
      const req = {
        body: { email: 'bob@digital.justice.gov.uk' },
        flash: jest.fn(),
        originalUrl: '/some-location',
      }
      await createUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createUserErrors', [
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

      createUserApi.mockRejectedValue(error)
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
      await createUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/some-location')
      expect(req.flash).toBeCalledWith('createUserErrors', [
        {
          href: '#email',
          text: 'Email already exists',
        },
      ])
    })
  })
})
