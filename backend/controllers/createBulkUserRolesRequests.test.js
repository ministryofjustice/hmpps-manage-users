const fs = require('fs')
const path = require('path')
const { createBulkUserRolesRequestsFactory } = require('./createBulkUserRolesRequests')

describe('change user roles in bulk', () => {
  const getSearchableRolesApi = jest.fn()
  const bulkUserRolesController = createBulkUserRolesRequestsFactory(getSearchableRolesApi)
  const render = jest.fn()
  const redirect = jest.fn()
  const getCsrfToken = jest.fn()
  const spyUnlink = jest.spyOn(fs.promises, 'unlink').mockResolvedValue()

  const rolesList = [
    { roleName: 'r1', roleCode: 'ROLE_ONE' },
    { roleName: 'r2', roleCode: 'ROLE_TWO' },
    { roleName: 'r3', roleCode: 'ROLE_THREE' },
  ]

  const mappedRolesList = [
    { text: 'r1', value: 'ROLE_ONE' },
    { text: 'r2', value: 'ROLE_TWO' },
    { text: 'r3', value: 'ROLE_THREE' },
  ]

  const req = {
    body: {},
    session: {
      userDetails: {
        username: 'Robert Bobby',
      },
      bulkUserRoles: {},
    },
  }
  const resp = { render, redirect }

  beforeEach(() => {
    jest.clearAllMocks()
    req.session.bulkUserRoles = {}
  })

  afterAll(() => {
    spyUnlink.mockRestore()
  })

  describe('Start new request', () => {
    it('start new request returns the expected page', async () => {
      await bulkUserRolesController.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: {} })
    })

    it('start new request sets session.bulkUserRoles object if not present', async () => {
      req.session.bulkUserRoles = undefined
      await bulkUserRolesController.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: {} })
    })

    it('start new request passes existing session.bulkUserRoles object if present', async () => {
      req.session.bulkUserRoles = { jiraReference: '12345' }
      await bulkUserRolesController.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: { jiraReference: '12345' } })
    })
  })

  describe('Post Jira Reference', () => {
    it('submitting empty Jira Reference returns to input page with error message', async () => {
      await bulkUserRolesController.postJiraReference(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', {
        jiraReferenceError: 'jira reference is required and cannot be empty',
      })
    })

    it('submitting whitespace Jira Reference returns to input page with error message', async () => {
      req.body = { jiraReference: '   ' }
      await bulkUserRolesController.postJiraReference(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', {
        jiraReferenceError: 'jira reference is required and cannot be empty',
      })
    })

    it('submitting valid Jira Reference redirects to select roles page', async () => {
      req.body = { jiraReference: '12345' }
      await bulkUserRolesController.postJiraReference(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/select-roles')
      expect(req.session.bulkUserRoles).not.toBeNull()
      expect(req.session.bulkUserRoles.jiraReference).toBeDefined()
      expect(req.session.bulkUserRoles.dateRequested).toBeDefined()
      expect(req.session.bulkUserRoles.requestedBy).toEqual('Robert Bobby')
      expect(req.session.bulkUserRoles.jiraReference).toEqual('12345')
    })

    it('submitting valid Jira Reference when all other fields are present redirects to summary page', async () => {
      req.session.bulkUserRoles = {
        dateRequested: new Date(),
        jiraReference: undefined,
        requestedBy: 'Robert Bobby',
        users: ['u1', 'u2', 'u3'],
        roles: ['r1', 'r2', 'r3'],
        uploadFile: 'file-content-here',
      }
      req.body = { jiraReference: '12345' }
      await bulkUserRolesController.postJiraReference(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')
      expect(render).not.toHaveBeenCalled()

      expect(req.session.bulkUserRoles).not.toBeNull()
      expect(req.session.bulkUserRoles.dateRequested).toBeDefined()
      expect(req.session.bulkUserRoles.jiraReference).toEqual('12345')
      expect(req.session.bulkUserRoles.requestedBy).toEqual('Robert Bobby')
      expect(req.session.bulkUserRoles.users).toEqual(['u1', 'u2', 'u3'])
      expect(req.session.bulkUserRoles.roles).toEqual(['r1', 'r2', 'r3'])
      expect(req.session.bulkUserRoles.uploadFile).toEqual('file-content-here')
    })

    test.each([
      {
        dateRequested: undefined,
        requestedBy: undefined,
        users: undefined,
        roles: undefined,
        uploadFile: undefined,
      },
      {
        dateRequested: new Date(),
        requestedBy: undefined,
        users: undefined,
        roles: undefined,
        uploadFile: undefined,
      },
      {
        dateRequested: new Date(),
        requestedBy: 'ME',
        users: undefined,
        roles: undefined,
        uploadFile: undefined,
      },
      {
        dateRequested: new Date(),
        requestedBy: 'ME',
        users: ['u1'],
        roles: undefined,
        uploadFile: undefined,
      },
      {
        dateRequested: new Date(),
        requestedBy: 'ME',
        users: ['u1'],
        roles: ['r1'],
        uploadFile: undefined,
      },
    ])(
      'submitting valid Jira Reference redirects to select roles page when not all request fields have been set',
      async (sessionValue) => {
        req.session.bulkUserRoles = sessionValue
        req.body = { jiraReference: '12345' }
        await bulkUserRolesController.postJiraReference(req, resp)

        expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/select-roles')
        expect(render).not.toHaveBeenCalled()

        expect(req.session.bulkUserRoles).not.toBeNull()
        expect(req.session.bulkUserRoles.dateRequested).toEqual(sessionValue.dateRequested)
        expect(req.session.bulkUserRoles.jiraReference).toEqual('12345')
        expect(req.session.bulkUserRoles.requestedBy).toEqual(sessionValue.requestedBy)
        expect(req.session.bulkUserRoles.users).toEqual(sessionValue.users)
        expect(req.session.bulkUserRoles.roles).toEqual(sessionValue.roles)
        expect(req.session.bulkUserRoles.uploadFile).toEqual(sessionValue.uploadFile)
      },
    )
  })

  describe('Get select roles', () => {
    it('get select roles returns the expected page with the list of roles', async () => {
      getSearchableRolesApi.mockResolvedValue(rolesList)

      await bulkUserRolesController.getSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesSelectRoles.njk', {
        rolesList: mappedRolesList,
        selectedRoles: [],
        maxSelections: 5,
      })
    })

    it('get select roles populate selectedRoles if values in session', async () => {
      req.session.bulkUserRoles.roles = [{ roleName: 'r1', roleCode: 'ROLE_ONE' }]

      getSearchableRolesApi.mockResolvedValue(rolesList)

      await bulkUserRolesController.getSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesSelectRoles.njk', {
        rolesList: mappedRolesList,
        maxSelections: 5,
        selectedRoles: [{ roleName: 'r1', roleCode: 'ROLE_ONE' }],
      })
    })

    it('get select roles throws error if get roles fails', async () => {
      getSearchableRolesApi.mockRejectedValue(Error('get roles failed with error'))

      await expect(bulkUserRolesController.getSelectRoles(req, resp)).rejects.toThrow('get roles failed with error')

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
    })
  })

  describe('Post selected roles', () => {
    it('throws error when no roles selected and get roles api request throws an error', async () => {
      getSearchableRolesApi.mockRejectedValue(Error('get roles failed with error'))
      req.body = []

      await expect(bulkUserRolesController.postSelectRoles(req, resp)).rejects.toThrow('get roles failed with error')

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
    })

    test.each([{ selectedRoles: undefined }, { selectedRoles: [] }])(
      'renders select roles page with error when no roles are selected',
      async ({ selectedRoles }) => {
        getSearchableRolesApi.mockResolvedValue(rolesList)

        req.body = selectedRoles

        await bulkUserRolesController.postSelectRoles(req, resp)

        expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
        expect(render).toHaveBeenCalledWith('createBulkUserRolesSelectRoles.njk', {
          rolesList: mappedRolesList,
          selectedRoles: [],
          selectRolesError: 'at least one role must be selected',
        })
        expect(redirect).not.toHaveBeenCalled()
      },
    )

    it('renders select roles page with error if more than 5 roles are selected', async () => {
      getSearchableRolesApi.mockResolvedValue(rolesList)

      const selectedRoles = [
        { text: 'r1', value: 'ROLE_ONE' },
        { text: 'r2', value: 'ROLE_TWO' },
        { text: 'r3', value: 'ROLE_THREE' },
        { text: 'r4', value: 'ROLE_FOUR' },
        { text: 'r5', value: 'ROLE_FIVE' },
        { text: 'r6', value: 'ROLE_SIX' },
      ]
      req.body = { selectedRoles }

      await bulkUserRolesController.postSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesSelectRoles.njk', {
        rolesList: mappedRolesList,
        selectedRoles,
        selectRolesError: 'a maximum of 5 roles can be selected',
      })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('renders select roles page with error if unknown or invalid role value is selected', async () => {
      getSearchableRolesApi.mockResolvedValue(rolesList)

      const selectedRoles = ['ROLE_ONE', 'ROLE_NINETY_NINE']
      req.body = { selectedRoles }

      await bulkUserRolesController.postSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesSelectRoles.njk', {
        rolesList: mappedRolesList,
        selectedRoles: ['ROLE_ONE'],
        selectRolesError: 'invalid role value selected ROLE_NINETY_NINE',
      })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('redirects to upload users page when valid roles selected and not all inputs have been provided', async () => {
      getSearchableRolesApi.mockResolvedValue(rolesList)

      const selectedRoles = ['ROLE_ONE']
      req.body = { selectedRoles }

      await bulkUserRolesController.postSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/upload-users')
      expect(req.session.bulkUserRoles.roles).toEqual(selectedRoles)
    })

    it('redirects to summary page when valid roles selected and all inputs have been provided', async () => {
      getSearchableRolesApi.mockResolvedValue(rolesList)

      const dateRequested = new Date()
      req.session.bulkUserRoles.jiraReference = '12345'
      req.session.bulkUserRoles.dateRequested = dateRequested
      req.session.bulkUserRoles.requestedBy = 'Robert Bobby'
      req.session.bulkUserRoles.users = ['User1', 'User2', 'User3']
      req.session.bulkUserRoles.uploadFile = 'file1'

      const selectedRoles = ['ROLE_ONE']
      req.body = { selectedRoles }

      await bulkUserRolesController.postSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')
      expect(req.session.bulkUserRoles.jiraReference).toEqual('12345')
      expect(req.session.bulkUserRoles.dateRequested).toEqual(dateRequested)
      expect(req.session.bulkUserRoles.requestedBy).toEqual('Robert Bobby')
      expect(req.session.bulkUserRoles.users).toEqual(['User1', 'User2', 'User3'])
      expect(req.session.bulkUserRoles.roles).toEqual(selectedRoles)
      expect(req.session.bulkUserRoles.uploadFile).toEqual('file1')
    })
  })

  describe('Get UsersCsvUpload', () => {
    it('renders upload users csv page', async () => {
      await bulkUserRolesController.getUsersCsvUpload(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesUploadCsv.njk')
    })
  })

  describe('Post users csv', () => {
    it('renders upload users csv page when no file uploaded', async () => {
      req.file = undefined
      req.csrfToken = getCsrfToken.mockReturnValue('AAA111BBB222CCC333')

      await bulkUserRolesController.postUserCsvUpload(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesUploadCsv.njk', {
        fileError: 'file is required but was null',
        csrfToken: 'AAA111BBB222CCC333',
      })
      expect(spyUnlink).toHaveBeenCalledTimes(0)
    })

    test.each([
      {
        desc: 'non csv',
        file: { originalname: 'file.html', path: resolveFilePath('users-html.html') },
        expectedError: 'csv file is required',
      },
      {
        desc: 'empty csv',
        file: { originalname: 'file.csv', path: resolveFilePath('empty-users.csv') },
        expectedError: 'csv must contain at least 1 row',
      },
      {
        desc: '1 row only',
        file: { originalname: 'file.csv', path: resolveFilePath('users-no-header.csv') },
        expectedError: 'csv must contain at least 1 row',
      },
      {
        desc: 'csv with multiple columns',
        file: { originalname: 'file.csv', path: resolveFilePath('users-multiple-columns.csv') },
        expectedError: 'csv file should contain single column "userId"',
      },
    ])('renders upload users csv page when invalid file uploaded: $desc', async (testCase) => {
      req.file = testCase.file
      req.csrfToken = getCsrfToken.mockReturnValue('AAA111BBB222CCC333')

      await bulkUserRolesController.postUserCsvUpload(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesUploadCsv.njk', {
        fileError: testCase.expectedError,
        csrfToken: 'AAA111BBB222CCC333',
      })
      expect(spyUnlink).toHaveBeenNthCalledWith(1, testCase.file.path)
    })

    it('renders summary page when valid file uploaded', async () => {
      req.file = { originalname: 'file.csv', path: resolveFilePath('valid-users.csv') }
      req.csrfToken = getCsrfToken.mockReturnValue('AAA111BBB222CCC333')

      await bulkUserRolesController.postUserCsvUpload(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')
      expect(spyUnlink).toHaveBeenNthCalledWith(1, resolveFilePath('valid-users.csv'))

      expect(req.session.bulkUserRoles.users).toEqual(['X123456', 'Y999999'])
      expect(req.session.bulkUserRoles.uploadFile).toEqual('file.csv')
    })
  })
})

function resolveFilePath(filename) {
  return path.join(__dirname, '..', '..', 'fixtures', 'bulkUserRoles', filename)
}
