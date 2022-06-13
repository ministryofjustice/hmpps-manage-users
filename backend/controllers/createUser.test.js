const { createUserFactory } = require('./createUser')

describe('create user factory', () => {
  const createUser = createUserFactory('/create-dps-user')
  const userTypeValues = [
    { value: 'DPS_ADM', text: 'Central Admin' },
    { value: 'DPS_GEN', text: 'General User' },
    { value: 'DPS_LSA', text: 'Local System Administrator (LSA)' },
  ]

  describe('index', () => {
    it('should call create user render', async () => {
      const req = { params: {}, flash: jest.fn() }
      const render = jest.fn()
      await createUser.index(req, { render })
      expect(render).toBeCalledWith('createUser.njk', {
        userTypeValues,
        errors: undefined,
      })
    })

    it('should copy any flash errors over', async () => {
      const req = { params: {}, flash: jest.fn().mockReturnValue({ error: 'some error' }) }

      const render = jest.fn()
      await createUser.index(req, { render })
      expect(render).toBeCalledWith('createUser.njk', {
        errors: { error: 'some error' },
        userTypeValues,
      })
    })
  })

  describe('post', () => {
    it('should stash user type and redirect', async () => {
      const req = {
        body: {
          userType: 'DPS_GEN',
        },
        flash: jest.fn(),
        session: {},
      }
      const render = jest.fn()
      const redirect = jest.fn()
      const locals = jest.fn()
      await createUser.post(req, { render, locals, redirect })

      expect(req.flash).toBeCalledWith('user', [{ userType: 'DPS_GEN' }])
      expect(redirect).toBeCalledWith('/create-dps-user')
    })

    it('should stash the error and redirect if no usertype selected', async () => {
      const req = { params: {}, body: {}, flash: jest.fn(), originalUrl: '/original' }

      const redirect = jest.fn()
      await createUser.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('createUserErrors', [
        {
          href: '#userType',
          text: 'Select a user type',
        },
      ])
    })
  })
})
