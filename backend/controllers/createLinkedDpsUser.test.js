const { createLinkedDpsUserFactory } = require('./createLinkedDpsUser')

describe('create linked user factory', () => {
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
    '/manage-dps-users',
  )

  describe('index', () => {
    it('should call create-user render scenario 1', async () => {
      const req = {
        query: { action: 'searchUser' },
        flash: jest.fn().mockReturnValueOnce(''),
      }
      const render = jest.fn()
      const redirect = jest.fn()
      await createLinkedDpsUser.index(req, { render, redirect })

      expect(req.flash).toBeCalledWith('user')
      expect(redirect).toBeCalledWith('/create-linked-dps-user')
    })

    it('should call create-user render scenario 2', async () => {
      const req = {
        query: { action: '' },
        flash: jest.fn().mockReturnValueOnce(''),
      }
      const render = jest.fn()
      const redirect = jest.fn()
      await createLinkedDpsUser.index(req, { render, redirect })

      expect(req.flash).toBeCalledWith('user')
      expect(redirect).toBeCalledWith('/create-user')
    })

    it('should call create-user render scenario 3', async () => {
      const req = {
        params: {},
        flash: jest.fn().mockReturnValueOnce([{ userType: 'DPS_GEN', userExists: 'true' }]),
      }
      getCaseloads.mockResolvedValue([{ id: 'MDI', name: 'Moorland HMP' }])

      const render = jest.fn()
      const redirect = jest.fn()
      await createLinkedDpsUser.index(req, { render, redirect })

      expect(req.flash).toBeCalledWith('user')
      expect(req.flash).toBeCalledWith('createDpsUserErrors')
      expect(render).toBeCalledWith('createDpsLinkedGeneralUser.njk', {
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
      expect(render).toBeCalledWith('createDpsLinkedGeneralUser.njk', {
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
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_GEN' }])
          .mockReturnValueOnce({ error: 'some error' }),
        session: {},
      }
      searchUser.mockResolvedValue({
        email: 'bob@digital.justice.gov.uk',
        username: 'BOB_ADM',
        firstName: 'bob',
        lastName: 'smith',
      })
      getCaseloads.mockResolvedValue([{ id: 'MDI', name: 'Moorland HMP' }])
      const render = jest.fn()
      const redirect = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })
      expect(searchUser).toBeCalledWith(locals, req.body.existingUsername)
      /*      expect(render).toBeCalledWith('createDpsLinkedGeneralUser.njk', {
        existingUsername: 'BOB_ADM',
        firstName: 'bob',
        lastName: 'smith',
        caseloadDropdownValues: [{ text: 'Moorland HMP', value: 'MDI' }],
        userType: 'DPS_GEN',
        title: `Create a Linked DPS user`,
        showCaseloadDropdown: true,
        email: 'bob@digital.justice.gov.uk',
        errors: [{ userType: 'DPS_GEN' }],
      }) */
    })
  })

  describe('post create linked user', () => {
    it('should create general user and link to existing admin and redirect', async () => {
      const req = {
        params: {},
        body: {
          existingUsername: 'BOB_ADM',
          generalUsername: 'bob',
          defaultCaseloadId: 'smith',
          userType: 'DPS_GEN',
          createUser: 'create-gen',
        },
        flash: jest
          .fn()
          .mockReturnValueOnce([{ userType: 'DPS_GEN' }])
          .mockReturnValueOnce({ error: 'some error' }),
        session: {},
      }
      createLinkedGeneralUser.mockResolvedValue({ generalAccount: { username: 'BOB_ADM' } })

      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })

      expect(createLinkedGeneralUser).toBeCalledWith(locals, {
        existingAdminUsername: 'BOB_ADM',
        generalUsername: 'bob',
        defaultCaseloadId: 'smith',
      })
      expect(render).toBeCalledWith('createLinkedDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_ADM/details',
      })
    })

    it('should create admin user and link to general user and redirect', async () => {
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
        session: {},
      }
      createLinkedAdminUser.mockResolvedValue({ adminAccount: { username: 'BOB_ADM' } })

      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })

      expect(createLinkedAdminUser).toBeCalledWith(locals, {
        existingUsername: 'BOB_GEN',
        adminUsername: 'BOB_ADM',
      })
      expect(render).toBeCalledWith('createLinkedDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_ADM/details',
      })
    })

    it('should create admin user and link to general user and redirect', async () => {
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
        session: {},
      }
      createLinkedAdminUser.mockResolvedValue({ adminAccount: { username: 'BOB_ADM' } })

      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })

      expect(createLinkedAdminUser).toBeCalledWith(locals, {
        existingUsername: 'BOB_GEN',
        adminUsername: 'BOB_ADM',
      })
      expect(render).toBeCalledWith('createLinkedDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_ADM/details',
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
        session: {},
      }
      createLinkedLsaUser.mockResolvedValue({ adminAccount: { username: 'BOB_LSA' } })

      const render = jest.fn()
      const locals = jest.fn()
      await createLinkedDpsUser.post(req, { render, locals })

      expect(createLinkedLsaUser).toBeCalledWith(locals, {
        existingUsername: 'BOB_GEN',
        adminUsername: 'BOB_LSA',
        localAdminGroup: 'smith',
      })
      expect(render).toBeCalledWith('createLinkedDpsUserSuccess.njk', {
        detailsLink: '/manage-dps-users/BOB_LSA/details',
      })
    })

    /*
it('should trim fields, create user and redirect', async () => {
  const req = {
    params: { userId: 'BOB_ADM' },
    body: {
      email: ' bob@digital.justice.gov.uk ',
      username: ' BOB_ADM ',
      firstName: ' bob ',
      lastName: ' smith ',
      userType: 'DPS_ADM',
    },
    flash: jest.fn(),
    session: {},
  }

  createLinkedAdminUser.mockResolvedValue({ username: 'BOB_ADM', primaryEmail: 'bob@digital.justice.gov.uk' })

  const render = jest.fn()
  const locals = jest.fn()
  await createLinkedDpsUser.post(req, { render, locals })

  expect(createLinkedAdminUser).toBeCalledWith(locals, {
    email: 'bob@digital.justice.gov.uk',
    username: 'BOB_ADM',
    firstName: 'bob',
    lastName: 'smith',
    defaultCaseloadId: 'MDI',
    userType: 'DPS_GEN',
  })
  expect(render).toBeCalledWith('createLinkedDpsUserSuccess.njk', {
    detailsLink: '/manage-dps-users/BOB_ADM/details',
  })
})

it('should stash the errors and redirect if no details entered', async () => {
  const req = { params: {}, body: { userType: 'DPS_GEN' }, flash: jest.fn(), originalUrl: '/original' }

  const redirect = jest.fn()
  await createLinkedDpsUser.post(req, { redirect })
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
  ])
})

it('should show error if an email is invalid', async () => {
  const req = {
    params: {},
    body: {
      username: ' BOB_ADM ',
      email: ' invalidemail ',
      firstName: ' bob ',
      lastName: ' smith ',
      userType: 'DPS_GEN',
    },
    flash: jest.fn(),
    originalUrl: '/original',
  }

  const redirect = jest.fn()
  await createLinkedDpsUser.post(req, { redirect })
  expect(redirect).toBeCalledWith('/original')
  expect(req.flash).toBeCalledWith('createDpsUserErrors', [
    {
      href: '#email',
      text: 'Enter an email address in the correct format, like first.last@justice.gov.uk',
    },
  ])
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
    body: {
      email: 'bob@digital.justice.gov.uk',
      username: 'BOB_ADM',
      firstName: 'bob',
      lastName: 'smith',
      userType: 'DPS_GEN',
    },
    flash: jest.fn(),
    originalUrl: '/some-location',
  }
  await createLinkedDpsUser.post(req, { redirect })
  expect(redirect).toBeCalledWith('/some-location')
  expect(req.flash).toBeCalledWith('createDpsUserErrors', [
    {
      text: 'something went wrong',
    },
  ])
})

it('should fail gracefully if username already exists', async () => {
  const redirect = jest.fn()
  const error = {
    ...new Error('This failed'),
    status: 409,
    response: { body: { errorCode: 601, userMessage: 'Username already exists' } },
  }

  createLinkedAdminUser.mockRejectedValue(error)
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
  }
  await createLinkedDpsUser.post(req, { redirect })
  expect(redirect).toBeCalledWith('/some-location')
  expect(req.flash).toBeCalledWith('createDpsUserErrors', [
    {
      href: '#username',
      text: 'Username already exists',
    },
  ])
})

it('should fail gracefully if email domain is invalid', async () => {
  const redirect = jest.fn()
  const error = {
    ...new Error('This failed'),
    status: 409,
    response: { body: { errorCode: 602, userMessage: 'Invalid Email domain' } },
  }

  createLinkedAdminUser.mockRejectedValue(error)
  const req = {
    params: {},
    body: {
      email: 'bob@digital.justice.gov.uk',
      username: 'BOB_ADM',
      firstName: 'bob',
      lastName: 'smith',
      userType: 'DPS_GEN',
    },
    flash: jest.fn(),
    originalUrl: '/some-location',
  }
  await createLinkedDpsUser.post(req, { redirect })
  expect(redirect).toBeCalledWith('/some-location')
  expect(req.flash).toBeCalledWith('createDpsUserErrors', [
    {
      href: '#email',
      text: 'Invalid Email domain',
    },
  ])
}) */
  })
})
