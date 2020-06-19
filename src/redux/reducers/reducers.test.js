import { app, maintainRoles, maintainAuthUsers } from './index'
import { setMenuOpen } from '../actions'
import * as types from '../actions/actionTypes'

const appInitialState = {
  error: null,
  message: null,
  loaded: false,
}

const appWithErrorState = {
  error: 'There was a problem',
  message: null,
  loaded: false,
}

const appWithValidationErrorState = {
  validationErrors: { myField: 'An error!' },
}

const maintainRolesInitialState = {
  roleList: [],
  roleFilterList: [],
  userList: [],
  nameFilter: '',
  roleFilter: '',
  roleAdd: '',
  pageNumber: 0,
  pageSize: 10,
  totalRecords: 0,
  contextUser: {
    agencyDescription: '',
    expiredFlag: false,
    firstName: '',
    lastName: '',
    lockedFlag: false,
    staffId: 0,
    username: '',
  },
}

const maintainAuthUsersInitialState = {
  userList: [],
  roleList: [],
  contextUser: {},
}

describe('app (global) reducer', () => {
  it('should return the initial state', () => {
    expect(app(undefined, {})).toEqual({
      config: {
        mailTo: '',
        notmEndpointUrl: '',
      },
      user: {
        expiredFlag: false,
        firstName: '',
        lastName: '',
        lockedFlag: false,
        maintainAccess: false,
        maintainAccessAdmin: false,
        staffId: 0,
        username: '',
      },
      shouldShowTerms: false,
      error: '',
      message: '',
      loaded: false,
      menuOpen: false,
      page: 0,
      validationErrors: {},
    })
  })

  it('should handle SET_CONFIG', () => {
    expect(
      app(appInitialState, {
        type: types.SET_CONFIG,
        config: { mailTo: 'a@b.com' },
      })
    ).toEqual({
      error: null,
      message: null,
      config: { mailTo: 'a@b.com' },
      loaded: false,
    })
  })

  it('should handle SET_USER_DETAILS', () => {
    expect(
      app(appInitialState, {
        type: types.SET_USER_DETAILS,
        user: { field: 'value' },
      })
    ).toEqual({
      error: null,
      message: null,
      user: { field: 'value' },
      loaded: false,
    })
  })

  it('should handle SET_TERMS_VISIBILITY', () => {
    expect(
      app(appInitialState, {
        type: types.SET_TERMS_VISIBILITY,
        shouldShowTerms: true,
      })
    ).toEqual({
      error: null,
      message: null,
      shouldShowTerms: true,
      loaded: false,
    })
  })

  it('should handle SET_ERROR', () => {
    expect(
      app(appInitialState, {
        type: types.SET_ERROR,
        error: 'HELP!',
      })
    ).toEqual({
      error: 'HELP!',
      message: null,
      loaded: false,
    })
  })

  it('should handle RESET_ERROR', () => {
    expect(
      app(appWithErrorState, {
        type: types.RESET_ERROR,
      })
    ).toEqual({ error: '', loaded: false, message: null })
  })

  it('should handle SET_MESSAGE', () => {
    expect(
      app(appInitialState, {
        type: types.SET_MESSAGE,
        message: 'An important message!',
      })
    ).toEqual({
      error: null,
      message: 'An important message!',
      loaded: false,
    })
  })

  it('should handle SET_LOADED', () => {
    expect(
      app(appInitialState, {
        type: types.SET_LOADED,
        loaded: true,
      })
    ).toEqual({
      error: null,
      message: null,
      loaded: true,
    })
  })

  it('should handle SET_VALIDATION_ERROR (first error)', () => {
    expect(
      app(appInitialState, {
        type: types.SET_VALIDATION_ERROR,
        fieldName: 'myField',
        message: 'An error!',
      })
    ).toEqual({
      error: null,
      message: null,
      loaded: false,
      validationErrors: { myField: 'An error!' },
    })
  })

  it('should handle SET_VALIDATION_ERROR (second error)', () => {
    expect(
      app(appWithValidationErrorState, {
        type: types.SET_VALIDATION_ERROR,
        fieldName: 'myField2',
        message: 'Another error!',
      })
    ).toEqual({
      validationErrors: {
        myField: 'An error!',
        myField2: 'Another error!',
      },
    })
  })

  it('should handle RESET_VALIDATION_ERRORS', () => {
    expect(
      app(appWithValidationErrorState, {
        type: types.RESET_VALIDATION_ERRORS,
      })
    ).toEqual({
      validationErrors: {},
    })
  })

  it('should handle SET_MENU_OPEN', () => {
    let state = app(appInitialState, setMenuOpen(true))

    expect(state.menuOpen).toBe(true)

    state = app(appInitialState, setMenuOpen(false))

    expect(state.menuOpen).toBe(false)
  })
})

describe('Maintain roles reducer', () => {
  it('should return the initial state', () => {
    expect(maintainRoles(undefined, {})).toEqual(maintainRolesInitialState)
  })

  it('should handle SET_USER_SEARCH_ROLE_FILTER', () => {
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.roleFilter = 'newRole'
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_ROLE_FILTER,
        roleFilter: 'newRole',
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_ROLE_ADD', () => {
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.roleAdd = 'newRole'
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_ROLE_ADD,
        roleAdd: 'newRole',
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_NAME_FILTER', () => {
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.nameFilter = 'name'
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_NAME_FILTER,
        nameFilter: 'name',
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_PAGINATION_PAGE_SIZE', () => {
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.pageSize = 5
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_PAGINATION_PAGE_SIZE,
        pageSize: 5,
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_PAGINATION_PAGE_NUMBER', () => {
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.pageNumber = 5
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_PAGINATION_PAGE_NUMBER,
        pageNumber: 5,
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_PAGINATION_TOTAL_RECORDS', () => {
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.totalRecords = 5
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_PAGINATION_TOTAL_RECORDS,
        totalRecords: 5,
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_ROLE_LIST', () => {
    const list = [{ name: 'Jack', keyworker: 'Jill' }]
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.roleList = list
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_ROLE_LIST,
        roleList: list,
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_ROLE_FILTER_LIST', () => {
    const list = [{ name: 'Jack', keyworker: 'Jill' }]
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.roleFilterList = list
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_ROLE_FILTER_LIST,
        roleFilterList: list,
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_USER_LIST', () => {
    const list = [{ name: 'Jack', keyworker: 'Jill' }]
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.userList = list
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_RESULTS_LIST,
        userList: list,
      })
    ).toEqual(updatedMaintainRoles)
  })

  it('should handle SET_USER_SEARCH_CONTEXT_USER', () => {
    const user = { firstName: 'Jack', lastName: 'Jill' }
    const updatedMaintainRoles = maintainRolesInitialState
    updatedMaintainRoles.contextUser = user
    expect(
      maintainRoles(maintainRolesInitialState, {
        type: types.SET_USER_SEARCH_CONTEXT_USER,
        contextUser: user,
      })
    ).toEqual(updatedMaintainRoles)
  })
})

describe('maintain auth users', () => {
  it('should return the initial state', () => {
    expect(maintainAuthUsers(undefined, {})).toEqual(maintainAuthUsersInitialState)
  })

  it('should handle SET_AUTH_USER_SEARCH_RESULTS_LIST', () => {
    const updatedMaintainAuthUsers = maintainAuthUsersInitialState
    updatedMaintainAuthUsers.userList = [{ username: 'someuser' }]
    expect(
      maintainAuthUsers(maintainAuthUsersInitialState, {
        type: types.SET_AUTH_USER_SEARCH_RESULTS_LIST,
        userList: [{ username: 'someuser' }],
      })
    ).toEqual(updatedMaintainAuthUsers)
  })

  it('should handle SET_AUTH_USER_ROLE_LIST', () => {
    const updatedMaintainAuthUsers = maintainAuthUsersInitialState
    updatedMaintainAuthUsers.roleList = [{ username: 'someuser' }]
    expect(
      maintainAuthUsers(maintainAuthUsersInitialState, {
        type: types.SET_AUTH_USER_ROLE_LIST,
        roleList: [{ username: 'someuser' }],
      })
    ).toEqual(updatedMaintainAuthUsers)
  })

  it('should handle SET_AUTH_USER_CONTEXT_USER', () => {
    const updatedMaintainAuthUsers = maintainAuthUsersInitialState
    updatedMaintainAuthUsers.contextUser = { username: 'someuser' }
    expect(
      maintainAuthUsers(maintainAuthUsersInitialState, {
        type: types.SET_AUTH_USER_CONTEXT_USER,
        contextUser: { username: 'someuser' },
      })
    ).toEqual(updatedMaintainAuthUsers)
  })
})
