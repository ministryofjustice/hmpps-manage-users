const { auditService } = require('@ministryofjustice/hmpps-audit-client')
const { selectGroupFactory } = require('./addGroup')
const { auditAction } = require('../utils/testUtils')
const { ManageUsersEvent } = require('../audit/manageUsersEvent')

describe('select groups factory', () => {
  const getUserAndGroups = jest.fn()
  const saveGroup = jest.fn()
  const addGroup = selectGroupFactory(getUserAndGroups, saveGroup, '/maintain-external-users', '/manage-external-users')

  beforeEach(() => {
    jest.resetAllMocks()
    jest.spyOn(auditService, 'sendAuditMessage').mockResolvedValue()
  })

  describe('index', () => {
    it('should call addGroup render', async () => {
      const req = { params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }, flash: jest.fn() }
      getUserAndGroups.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [{ groupName: 'name', groupCode: 'code' }],
        [{ groupName: 'name2', groupCode: 'code2' }],
      ])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.VIEW_USER_GROUPS_ATTEMPT))

      expect(render).toHaveBeenCalledWith('addGroup.njk', {
        errors: undefined,
        groupDropdownValues: [{ text: 'name', value: 'code' }],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })

    it('should filter out existing groups', async () => {
      const req = { params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' }, flash: jest.fn() }
      getUserAndGroups.mockResolvedValue([
        { username: 'BOB', firstName: 'Billy', lastName: 'Bob' },
        [{ groupName: 'name', groupCode: 'code' }],
        [
          { groupName: 'name', groupCode: 'code' },
          { groupName: 'name2', groupCode: 'code2' },
        ],
      ])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(render).toHaveBeenCalledWith('addGroup.njk', {
        errors: undefined,
        groupDropdownValues: [],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })

    it('should copy any flash errors over', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        flash: jest.fn().mockReturnValue({ error: 'some error' }),
      }
      getUserAndGroups.mockResolvedValue([{ username: 'BOB', firstName: 'Billy', lastName: 'Bob' }, [], []])

      const render = jest.fn()
      await addGroup.index(req, { render })
      expect(render).toHaveBeenCalledWith('addGroup.njk', {
        errors: { error: 'some error' },
        groupDropdownValues: [],
        staff: { name: 'Billy Bob', username: 'BOB' },
        staffUrl: '/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details',
      })
    })
  })

  describe('post', () => {
    const session = { userDetails: { username: 'username' } }
    it('should add the group and redirect', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: { group: 'GLOBAL_SEARCH' },
        flash: jest.fn(),
        session,
      }

      const redirect = jest.fn()
      const locals = jest.fn()
      await addGroup.post(req, { redirect, locals })
      expect(redirect).toHaveBeenCalledWith('/manage-external-users/00000000-aaaa-0000-aaaa-0a0a0a0a0a0a/details')
      expect(saveGroup).toHaveBeenCalledWith(locals, '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a', 'GLOBAL_SEARCH')

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.ADD_USER_GROUP_ATTEMPT))
    })

    it('should stash the errors and redirect if no group selected', async () => {
      const req = {
        params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
        body: {},
        flash: jest.fn(),
        originalUrl: '/original',
        session,
      }

      const redirect = jest.fn()
      await addGroup.post(req, { redirect })
      expect(redirect).toHaveBeenCalledWith('/original')
      expect(req.flash).toHaveBeenCalledWith('addGroupErrors', [{ href: '#group', text: 'Select a group' }])
    })

    it('should fail gracefully if group already on user', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 409 }
      saveGroup.mockRejectedValue(error)
      await addGroup.post(
        {
          params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
          body: { group: 'GLOBAL_SEARCH' },
          flash: jest.fn(),
          originalUrl: '/some-location',
          session,
        },
        { redirect },
      )
      expect(redirect).toHaveBeenCalledWith('/some-location')

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.ADD_USER_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.ADD_USER_GROUP_FAILURE))
    })

    it('should fail gracefully if group manager not allowed to maintain user', async () => {
      const redirect = jest.fn()
      const error = { ...new Error('This failed'), status: 403 }
      saveGroup.mockRejectedValue(error)
      await addGroup.post(
        {
          params: { userId: '00000000-aaaa-0000-aaaa-0a0a0a0a0a0a' },
          body: { group: 'GLOBAL_SEARCH' },
          flash: jest.fn(),
          originalUrl: '/some-location',
          session,
        },
        { redirect },
      )
      expect(redirect).toHaveBeenCalledWith('/some-location')

      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.ADD_USER_GROUP_ATTEMPT))
      expect(auditService.sendAuditMessage).toHaveBeenCalledWith(auditAction(ManageUsersEvent.ADD_USER_GROUP_FAILURE))
    })
  })
})
