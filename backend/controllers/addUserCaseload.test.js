const { selectCaseloadsFactory } = require('./addUserCaseload')

describe('select caseloads factory', () => {
  const getUserAssignableCaseloads = jest.fn()
  const saveCaseloads = jest.fn()
  const addUserCaseload = selectCaseloadsFactory(getUserAssignableCaseloads, saveCaseloads, '/manage-dps-users')

  describe('index', () => {
    it('should call addUserCaseload render', async () => {
      const req = {
        params: { userId: 'TEST_USER' },
        flash: jest.fn(),
        get: jest.fn().mockReturnValue('localhost'),
      }
      getUserAssignableCaseloads.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [
          { id: 'MDI', name: 'Moorland (HMP)' },
          { id: 'PVI', name: 'Pentonville (HMP)' },
        ],
      ])

      const render = jest.fn()
      await addUserCaseload.index(req, { render })
      expect(render).toBeCalledWith('addUserCaseload.njk', {
        errors: undefined,
        caseloadDropdownValues: [
          { text: 'Moorland (HMP)', value: 'MDI' },
          { text: 'Pentonville (HMP)', value: 'PVI' },
          { divider: 'or' },
          { behaviour: 'exclusive', text: 'All caseloads', value: 'ALL' },
        ],
        assignableIds: ['MDI', 'PVI'],
        staff: { username: 'BOB', firstName: 'Billy', lastName: 'Bob', name: 'Billy Bob' },
        staffUrl: '/manage-dps-users/TEST_USER/details',
        searchTitle: 'Search for a DPS user',
        searchUrl: '/search-with-filter-dps-users',
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: 'TEST_USER' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
        get: jest.fn().mockReturnValue('localhost'),
      }
      getUserAssignableCaseloads.mockResolvedValue([{ username: 'BOB', firstName: 'Billy', lastName: 'Bob' }, []])

      const render = jest.fn()
      await addUserCaseload.index(req, { render })
      expect(render).toBeCalledWith('addUserCaseload.njk', {
        errors: { error: 'some error' },
        caseloadDropdownValues: [],
        assignableIds: [],
        staff: { username: 'BOB', firstName: 'Billy', lastName: 'Bob', name: 'Billy Bob' },
        staffUrl: '/manage-dps-users/TEST_USER/details',
        searchTitle: 'Search for a DPS user',
        searchUrl: '/search-with-filter-dps-users',
      })
    })
  })

  describe('post', () => {
    it('should add the caseload and redirect', async () => {
      const req = {
        params: { userId: 'TEST_USER' },
        body: { caseloads: ['LEI', 'PVI'] },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addUserCaseload.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-dps-users/TEST_USER/details')
      expect(saveCaseloads).toBeCalledWith(locals, 'TEST_USER', ['LEI', 'PVI'])
    })

    it('should cope with single caseload being added', async () => {
      const req = {
        params: { userId: 'TEST_USER' },
        body: { caseloads: 'LEI' },
        flash: jest.fn(),
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addUserCaseload.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-dps-users/TEST_USER/details')
      expect(saveCaseloads).toBeCalledWith(locals, 'TEST_USER', ['LEI'])
    })

    it('should stash the errors and redirect if no caseloads selected', async () => {
      const req = {
        params: { userId: 'TEST_USER' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
      }

      const redirect = jest.fn()
      await addUserCaseload.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('addCaseloadErrors', [
        { href: '#caseloads', text: 'Select at least one caseload' },
      ])
    })
  })
})
