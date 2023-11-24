const { auditService } = require('hmpps-audit-client')

const { selectCaseloadsFactory } = require('./addUserCaseload')

describe('select caseloads factory', () => {
  const getUserAssignableCaseloads = jest.fn()
  const saveCaseloads = jest.fn()
  const addUserCaseload = selectCaseloadsFactory(getUserAssignableCaseloads, saveCaseloads, '/manage-dps-users')

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

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
        ],
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
        staff: { username: 'BOB', firstName: 'Billy', lastName: 'Bob', name: 'Billy Bob' },
        staffUrl: '/manage-dps-users/TEST_USER/details',
        searchTitle: 'Search for a DPS user',
        searchUrl: '/search-with-filter-dps-users',
      })
    })
  })

  describe('post', () => {
    const username = 'username'
    it('should add the caseload and redirect', async () => {
      const req = {
        params: { userId: 'TEST_USER' },
        body: { caseloads: ['LEI', 'PVI'] },
        flash: jest.fn(),
        session: { userDetails: { username } },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addUserCaseload.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-dps-users/TEST_USER/details')
      expect(saveCaseloads).toBeCalledWith(locals, 'TEST_USER', ['LEI', 'PVI'])
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: 'ADD_USER_CASELOAD',
        subjectId: 'TEST_USER',
        subjectType: 'USER_ID',
        who: username,
        details: '{"caseloads":["LEI","PVI"]}',
      })
    })

    it('should cope with single caseload being added', async () => {
      const req = {
        params: { userId: 'TEST_USER' },
        body: { caseloads: 'LEI' },
        flash: jest.fn(),
        session: { userDetails: { username } },
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addUserCaseload.post(req, { redirect, locals })
      expect(redirect).toBeCalledWith('/manage-dps-users/TEST_USER/details')
      expect(saveCaseloads).toBeCalledWith(locals, 'TEST_USER', ['LEI'])
      expect(auditService.sendAuditMessage).toBeCalledWith({
        action: 'ADD_USER_CASELOAD',
        subjectId: 'TEST_USER',
        subjectType: 'USER_ID',
        who: username,
        details: '{"caseloads":["LEI"]}',
      })
    })

    it('should stash the errors and redirect if no caseloads selected', async () => {
      const req = {
        params: { userId: 'TEST_USER' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session: { userDetails: { username } },
      }

      const redirect = jest.fn()
      await addUserCaseload.post(req, { redirect })
      expect(redirect).toBeCalledWith('/original')
      expect(req.flash).toBeCalledWith('addCaseloadErrors', [
        { href: '#caseloads', text: 'Select at least one caseload' },
      ])
      expect(auditService.sendAuditMessage).not.toBeCalled()
    })
  })
})
