const fsPromises = require('fs/promises')
const path = require('path')
const { createBulkUserRolesRequestsFactory } = require('./createBulkUserRolesRequests')

describe('change user roles in bulk', () => {
  const getSearchableRolesApi = jest.fn()
  const bulkUserRolesAdditions = jest.fn()
  const bulkUserRolesController = createBulkUserRolesRequestsFactory(getSearchableRolesApi, bulkUserRolesAdditions)
  const render = jest.fn()
  const redirect = jest.fn()
  const getCsrfToken = jest.fn()
  const spyUnlink = jest.spyOn(fsPromises, 'unlink').mockResolvedValue()

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
      bulkUserRolesRequest: {},
    },
  }
  const resp = { render, redirect, locals: {} }

  beforeEach(() => {
    jest.clearAllMocks()
    req.session = {
      userDetails: {
        username: 'Robert Bobby',
      },
      bulkUserRolesRequest: {},
    }
  })

  afterAll(() => {
    spyUnlink.mockRestore()
  })

  describe('Start new request', () => {
    it('start new request returns the expected page', async () => {
      await bulkUserRolesController.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: {} })
    })

    it('start new request sets session.bulkUserRolesRequest object if not present', async () => {
      req.session.bulkUserRolesRequest = undefined
      await bulkUserRolesController.getCreateNew(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesRequest.njk', { details: {} })
    })

    it('start new request passes existing session.bulkUserRolesRequest object if present', async () => {
      req.session.bulkUserRolesRequest = { jiraReference: '12345' }
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
      req.body = {
        jiraReference: '12345',
        requestBy: 'Robert Bobby',
      }
      await bulkUserRolesController.postJiraReference(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/select-roles')
      expect(req.session.bulkUserRolesRequest).not.toBeNull()
      expect(req.session.bulkUserRolesRequest.jiraReference).toBeDefined()
      expect(req.session.bulkUserRolesRequest.jiraReference).toEqual('12345')
    })

    it('submitting valid Jira Reference when all other fields are present redirects to summary page', async () => {
      req.session.bulkUserRolesRequest = {
        jiraReference: undefined,
        totalNumberOfUsers: 3,
        roles: ['r1', 'r2', 'r3'],
        usersFile: {
          filename: 'users.csv',
          path: '/filepath/here',
        },
      }
      req.body = { jiraReference: '12345' }
      await bulkUserRolesController.postJiraReference(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')
      expect(render).not.toHaveBeenCalled()

      expect(req.session.bulkUserRolesRequest).not.toBeNull()
      expect(req.session.bulkUserRolesRequest.jiraReference).toEqual('12345')
      expect(req.session.bulkUserRolesRequest.totalNumberOfUsers).toEqual(3)
      expect(req.session.bulkUserRolesRequest.roles).toEqual(['r1', 'r2', 'r3'])
      expect(req.session.bulkUserRolesRequest.usersFile).toBeDefined()
      expect(req.session.bulkUserRolesRequest.usersFile.filename).toEqual('users.csv')
      expect(req.session.bulkUserRolesRequest.usersFile.path).toEqual('/filepath/here')
    })

    test.each([
      {
        totalNumberOfUsers: undefined,
        roles: undefined,
        uploadFile: undefined,
      },
      {
        totalNumberOfUsers: 1,
        roles: undefined,
        uploadFile: undefined,
      },
      {
        totalNumberOfUsers: 1,
        roles: ['r1'],
        uploadFile: undefined,
      },
    ])(
      'submitting valid Jira Reference redirects to select roles page when not all request fields have been set',
      async (sessionValue) => {
        req.session.bulkUserRolesRequest = sessionValue
        req.body = { jiraReference: '12345' }
        await bulkUserRolesController.postJiraReference(req, resp)

        expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/select-roles')
        expect(render).not.toHaveBeenCalled()

        expect(req.session.bulkUserRolesRequest).not.toBeNull()
        expect(req.session.bulkUserRolesRequest.jiraReference).toEqual('12345')
        expect(req.session.bulkUserRolesRequest.totalNumberOfUsers).toEqual(sessionValue.totalNumberOfUsers)
        expect(req.session.bulkUserRolesRequest.roles).toEqual(sessionValue.roles)
        expect(req.session.bulkUserRolesRequest.uploadFile).toEqual(sessionValue.uploadFile)
      },
    )

    it('submit Jira Reference populate req.session.bulkUserRolesRequest if not present', async () => {
      req.session.bulkUserRolesRequest = undefined
      req.body = { jiraReference: '12345' }

      await bulkUserRolesController.postJiraReference(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/select-roles')
      expect(render).not.toHaveBeenCalled()

      expect(req.session.bulkUserRolesRequest).not.toBeNull()
      expect(req.session.bulkUserRolesRequest.jiraReference).toEqual('12345')
    })
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
      req.session.bulkUserRolesRequest.roles = [{ roleName: 'r1', roleCode: 'ROLE_ONE' }]

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

    it('get selectRoles populates req.session.bulkUserRolesRequest if not present', async () => {
      req.session.bulkUserRolesRequest = undefined

      getSearchableRolesApi.mockResolvedValue(rolesList)

      await bulkUserRolesController.getSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesSelectRoles.njk', {
        rolesList: mappedRolesList,
        selectedRoles: [],
        maxSelections: 5,
      })
      expect(req.session.bulkUserRolesRequest).toBeDefined()
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
          maxSelections: 5,
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
        maxSelections: 5,
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
        maxSelections: 5,
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
      expect(req.session.bulkUserRolesRequest.roles).toEqual(selectedRoles)
    })

    it('redirects to summary page when valid roles selected and all inputs have been provided', async () => {
      getSearchableRolesApi.mockResolvedValue(rolesList)

      req.session.bulkUserRolesRequest.jiraReference = '12345'
      req.session.bulkUserRolesRequest.totalNumberOfUsers = 3
      req.session.bulkUserRolesRequest.usersFile = { filename: 'file1.csv', path: '/tmp/file1.csv' }

      const selectedRoles = ['ROLE_ONE']
      req.body = { selectedRoles }

      await bulkUserRolesController.postSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')
      expect(req.session.bulkUserRolesRequest.jiraReference).toEqual('12345')
      expect(req.session.bulkUserRolesRequest.totalNumberOfUsers).toEqual(3)
      expect(req.session.bulkUserRolesRequest.roles).toEqual(selectedRoles)
      expect(req.session.bulkUserRolesRequest.usersFile).toBeDefined()
      expect(req.session.bulkUserRolesRequest.usersFile).toEqual({ filename: 'file1.csv', path: '/tmp/file1.csv' })
    })

    it('post select roles populates req.session.bulkUserRolesRequest if not present', async () => {
      req.session.bulkUserRolesRequest = undefined

      getSearchableRolesApi.mockResolvedValue(rolesList)

      const selectedRoles = ['ROLE_ONE']
      req.body = { selectedRoles }

      await bulkUserRolesController.postSelectRoles(req, resp)

      expect(getSearchableRolesApi).toHaveBeenCalledTimes(1)
      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/upload-users')
      expect(req.session.bulkUserRolesRequest).toBeDefined()
      expect(req.session.bulkUserRolesRequest.roles).toEqual(selectedRoles)
    })
  })

  describe('Get UsersCsvUpload', () => {
    it('renders upload users csv page', async () => {
      await bulkUserRolesController.getUsersCsvUpload(req, resp)
      expect(render).toHaveBeenCalledWith('createBulkUserRolesUploadCsv.njk')
    })

    it('get userCsvUpload populates req.session.bulkUserRolesRequest if not present', async () => {
      req.session.bulkUserRolesRequest = undefined

      await bulkUserRolesController.getUsersCsvUpload(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesUploadCsv.njk')
      expect(req.session.bulkUserRolesRequest).toBeDefined()
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
        expectedError: 'csv file should contain single column with header "userId"',
      },
      {
        desc: 'csv with multiple columns',
        file: { originalname: 'file.csv', path: resolveFilePath('users-multiple-columns.csv') },
        expectedError: 'csv file should contain single column with header "userId"',
      },
      {
        desc: 'csv empty user id values',
        file: { originalname: 'file.csv', path: resolveFilePath('valid-header-empty-user-value.csv') },
        expectedError: 'each row must contain a non null non empty userId',
      },
    ])('renders upload users csv page when invalid file uploaded: $desc', async (testCase) => {
      req.file = testCase.file
      req.csrfToken = getCsrfToken.mockReturnValue('AAA111BBB222CCC333')

      await bulkUserRolesController.postUserCsvUpload(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesUploadCsv.njk', {
        fileError: testCase.expectedError,
        csrfToken: 'AAA111BBB222CCC333',
      })
    })

    it('renders summary page when valid file uploaded', async () => {
      req.file = { originalname: 'file.csv', path: resolveFilePath('valid-users.csv') }
      req.csrfToken = getCsrfToken.mockReturnValue('AAA111BBB222CCC333')

      await bulkUserRolesController.postUserCsvUpload(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')

      expect(req.session.bulkUserRolesRequest.totalNumberOfUsers).toEqual(2)
      expect(req.session.bulkUserRolesRequest.usersFile).toEqual({
        filename: 'file.csv',
        path: resolveFilePath('valid-users.csv'),
      })
    })

    it('post users file populates req.session.bulkUserRolesRequest if not present', async () => {
      req.session.bulkUserRolesRequest = undefined
      req.file = { originalname: 'file.csv', path: resolveFilePath('valid-users.csv') }
      req.csrfToken = getCsrfToken.mockReturnValue('AAA111BBB222CCC333')

      await bulkUserRolesController.postUserCsvUpload(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')

      expect(req.session.bulkUserRolesRequest).toBeDefined()
      expect(req.session.bulkUserRolesRequest.totalNumberOfUsers).toEqual(2)
      expect(req.session.bulkUserRolesRequest.usersFile).toEqual({
        filename: 'file.csv',
        path: resolveFilePath('valid-users.csv'),
      })
    })
  })

  describe('Get summary', () => {
    it('renders create bulk user roles request summary', async () => {
      const bulkUserRoles = {
        jiraReference: '12345',
        totalNumberOfUsers: 3,
        roles: ['ROLE_1', 'ROLE_2'],
        usersFile: { filename: 'file.csv', path: resolveFilePath('file.csv') },
      }
      req.session.bulkUserRolesRequest = bulkUserRoles

      await bulkUserRolesController.getBulkRequestSummary(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesSummary.njk', {
        summary: {
          jiraReference: '12345',
          requestedBy: 'Robert Bobby',
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'file.csv',
          totalAssignments: 6,
          totalNumberOfUsers: 3,
        },
      })
    })

    test.each([
      {
        jiraReference: undefined,
        totalNumberOfUsers: undefined,
        roles: undefined,
        uploadFile: undefined,
      },
    ])('render summary page with error when not all details have been provided', async (bulkRolesRequest) => {
      req.session.bulkUserRolesRequest = bulkRolesRequest

      await bulkUserRolesController.getBulkRequestSummary(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesSummary.njk', {
        summary: {
          jiraReference: 'N/A',
          requestedBy: 'Robert Bobby',
          roles: [],
          uploadFile: 'N/A',
          totalAssignments: 0,
          totalNumberOfUsers: 0,
        },
        errors: [
          { text: 'Jira reference is required', href: '#change-jira-ref' },
          { text: 'Users ids required', href: '#change-users-ref' },
          { text: 'Roles is required', href: '#change-roles-ref' },
          { text: 'Upload file is required', href: '#change-users-ref' },
        ],
      })
    })

    it('get summary populates req.session.bulkUserRolesRequest if not present', async () => {
      req.session.bulkUserRolesRequest = undefined

      await bulkUserRolesController.getBulkRequestSummary(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesSummary.njk', {
        summary: {
          jiraReference: 'N/A',
          requestedBy: 'Robert Bobby',
          roles: [],
          uploadFile: 'N/A',
          totalAssignments: 0,
          totalNumberOfUsers: 0,
        },
        errors: [
          { text: 'Jira reference is required', href: '#change-jira-ref' },
          { text: 'Users ids required', href: '#change-users-ref' },
          { text: 'Roles is required', href: '#change-roles-ref' },
          { text: 'Upload file is required', href: '#change-users-ref' },
        ],
      })
      expect(req.session.bulkUserRolesRequest).toBeDefined()
    })
  })

  describe('Submit bulk user roles request summary', () => {
    test.each([
      {
        desc: 'jira reference undefined',
        details: {
          jiraReference: undefined,
          totalNumberOfUsers: 3,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'file1',
        },
      },
      {
        desc: 'jira reference null',
        details: {
          jiraReference: null,
          totalNumberOfUsers: 3,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'file1',
        },
      },
      {
        desc: 'jira reference empty',
        details: {
          jiraReference: '',
          totalNumberOfUsers: 3,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'file1',
        },
      },
      {
        desc: 'users undefined',
        details: {
          jiraReference: '12345',
          totalNumberOfUsers: undefined,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'file1',
        },
      },
      {
        desc: 'users null',
        details: {
          jiraReference: '12345',
          totalNumberOfUsers: null,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'file1',
        },
      },
      {
        desc: 'users empty',
        details: {
          jiraReference: '',
          totalNumberOfUsers: 0,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'file1',
        },
      },
      {
        desc: 'roles undefined',
        details: {
          jiraReference: '12345',
          totalNumberOfUsers: 3,
          roles: undefined,
          uploadFile: 'file1',
        },
      },
      {
        desc: 'roles null',
        details: {
          jiraReference: '12345',
          totalNumberOfUsers: 3,
          roles: null,
          uploadFile: 'file1',
        },
      },
      {
        desc: 'roles empty',
        details: {
          jiraReference: '12345',
          totalNumberOfUsers: 3,
          roles: [],
          uploadFile: 'file1',
        },
      },
      {
        desc: 'uploadFile undefined',
        details: {
          jiraReference: '12345',
          totalNumberOfUsers: 3,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: undefined,
        },
      },
      {
        desc: 'uploadFile null',
        details: {
          jiraReference: '12345',
          totalNumberOfUsers: 3,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: null,
        },
      },
      {
        desc: 'uploadFile empty',
        details: {
          jiraReference: '12345',
          totalNumberOfUsers: 3,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: '',
        },
      },
    ])('should redirect to summary page with errors if $desc', async (testCase) => {
      req.session.bulkUserRolesRequest = testCase.details

      await bulkUserRolesController.postSubmitBulkUserRolesRequest(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')
      expect(bulkUserRolesAdditions).not.toHaveBeenCalled()
    })

    it('should render confirmation page for valid successful request', async () => {
      req.session.bulkUserRolesRequest = {
        jiraReference: '12345',
        totalNumberOfUsers: 3,
        roles: ['ROLE_1', 'ROLE_2'],
        usersFile: { filename: 'users.csv', path: '/tmp/users.csv' },
      }

      await bulkUserRolesController.postSubmitBulkUserRolesRequest(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesConfirmation.njk', { jiraReference: '12345' })
      expect(bulkUserRolesAdditions).toHaveBeenCalledWith(
        resp.locals,
        { jiraReference: '12345', roles: ['ROLE_1', 'ROLE_2'] },
        { filename: 'users.csv', path: '/tmp/users.csv' },
      )
      expect(req.session.bulkUserRolesRequest).toBeUndefined()
    })

    it('should remove request details from session after successfully submitting request', async () => {
      req.session.bulkUserRolesRequest = {
        jiraReference: '12345',
        totalNumberOfUsers: 3,
        roles: ['ROLE_1', 'ROLE_2'],
        usersFile: { filename: 'users.csv', path: '/tmp/users.csv' },
      }

      await bulkUserRolesController.postSubmitBulkUserRolesRequest(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesConfirmation.njk', { jiraReference: '12345' })
      expect(req.session.bulkUserRolesRequest).toBeUndefined()
      expect(spyUnlink).toHaveBeenNthCalledWith(1, '/tmp/users.csv')
    })

    it('should not remove request details from session if bulkUserRolesAdditions fails', async () => {
      bulkUserRolesAdditions.mockRejectedValue('some error')

      req.session.bulkUserRolesRequest = {
        jiraReference: '12345',
        totalNumberOfUsers: 3,
        roles: ['ROLE_1', 'ROLE_2'],
        usersFile: { filename: 'users.csv', path: '/tmp/users.csv' },
      }

      await bulkUserRolesController.postSubmitBulkUserRolesRequest(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesSummary.njk', {
        submitRequestError: [{ text: 'Internal Server Error' }],
        summary: {
          requestedBy: 'Robert Bobby',
          jiraReference: '12345',
          totalNumberOfUsers: 3,
          totalAssignments: 6,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'users.csv',
        },
      })
      expect(bulkUserRolesAdditions).toHaveBeenCalledWith(
        resp.locals,
        { jiraReference: '12345', roles: ['ROLE_1', 'ROLE_2'] },
        { filename: 'users.csv', path: '/tmp/users.csv' },
      )

      expect(spyUnlink).not.toHaveBeenCalled()
      expect(req.session.bulkUserRolesRequest).toEqual({
        jiraReference: '12345',
        totalNumberOfUsers: 3,
        roles: ['ROLE_1', 'ROLE_2'],
        usersFile: { filename: 'users.csv', path: '/tmp/users.csv' },
      })
    })

    it('should populate req.session.bulkUserRolesRequest if not present', async () => {
      req.session.bulkUserRolesRequest = undefined

      await bulkUserRolesController.postSubmitBulkUserRolesRequest(req, resp)

      expect(redirect).toHaveBeenCalledWith('/change-roles-in-bulk/summary')
      expect(req.session.bulkUserRolesRequest).toBeDefined()
    })

    it('should redirect to summary page if submit request fails', async () => {
      req.session.bulkUserRolesRequest = {
        dateRequested: expect.any(Date),
        jiraReference: '12345',
        totalNumberOfUsers: 3,
        roles: ['ROLE_1', 'ROLE_2'],
        usersFile: { filename: 'users.csv', path: '/tmp/users.csv' },
      }

      bulkUserRolesAdditions.mockRejectedValue(Error('status 500!!'))

      await bulkUserRolesController.postSubmitBulkUserRolesRequest(req, resp)

      expect(render).toHaveBeenCalledWith('createBulkUserRolesSummary.njk', {
        submitRequestError: [{ text: 'Internal Server Error' }],
        summary: {
          requestedBy: 'Robert Bobby',
          jiraReference: '12345',
          totalNumberOfUsers: 3,
          totalAssignments: 6,
          roles: ['ROLE_1', 'ROLE_2'],
          uploadFile: 'users.csv',
        },
      })
    })
  })
})

function resolveFilePath(filename) {
  return path.join(__dirname, '..', '..', 'fixtures', 'bulkUserRoles', filename)
}
