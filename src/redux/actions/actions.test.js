import * as actions from './index'
import {
  RESET_ERROR,
  RESET_VALIDATION_ERRORS,
  SET_CONFIG,
  SET_ERROR,
  SET_LOADED,
  SET_MESSAGE,
  SET_USER_DETAILS,
  SET_USER_SEARCH_NAME_FILTER,
  SET_USER_SEARCH_PAGINATION_PAGE_NUMBER,
  SET_USER_SEARCH_PAGINATION_PAGE_SIZE,
  SET_USER_SEARCH_PAGINATION_TOTAL_RECORDS,
  SET_USER_SEARCH_RESULTS_LIST,
  SET_USER_SEARCH_ROLE_ADD,
  SET_USER_SEARCH_ROLE_FILTER,
  SET_USER_SEARCH_ROLE_FILTER_LIST,
  SET_USER_SEARCH_ROLE_LIST,
  SET_VALIDATION_ERROR,
} from './actionTypes'

describe('actions', () => {
  it('should create an action to update the config', () => {
    const expectedAction = {
      type: SET_CONFIG,
      config: {
        notmEndpointUrl: '/notm/endpoint',
        supportUrl: 'https://support',
        dpsEndpointUrl: 'http://dps',
      },
    }
    expect(
      actions.setConfig({
        notmEndpointUrl: '/notm/endpoint',
        supportUrl: 'https://support',
        dpsEndpointUrl: 'http://dps',
      })
    ).toEqual(expectedAction)
  })

  it('should create an action to setup login details', () => {
    const user = { field: 'user' }
    const expectedAction = {
      type: SET_USER_DETAILS,
      user,
    }
    expect(actions.setUserDetails(user)).toEqual(expectedAction)
  })

  it('should create an action to store an error', () => {
    const expectedAction = {
      type: SET_ERROR,
      error: 'Something went wrong',
    }
    expect(actions.setError('Something went wrong')).toEqual(expectedAction)
  })

  it('should create an action to reset the global error state', () => {
    const expectedAction = {
      type: RESET_ERROR,
    }
    expect(actions.resetError()).toEqual(expectedAction)
  })

  it('should create an action to store an info message', () => {
    const expectedAction = {
      type: SET_MESSAGE,
      message: 'Your stuff was saved.',
    }
    expect(actions.setMessage('Your stuff was saved.')).toEqual(expectedAction)
  })

  it('should create an action to update a loaded flag for rendering', () => {
    const expectedAction = {
      type: SET_LOADED,
      loaded: true,
    }
    expect(actions.setLoaded(true)).toEqual(expectedAction)
  })

  it('should create a validation error', () => {
    const expectedAction = {
      type: SET_VALIDATION_ERROR,
      fieldName: 'aField',
      message: 'a message',
    }
    expect(actions.setValidationError('aField', 'a message')).toEqual(expectedAction)
  })

  it('should clear all validation errors', () => {
    const expectedAction = {
      type: RESET_VALIDATION_ERRORS,
    }
    expect(actions.resetValidationErrors()).toEqual(expectedAction)
  })

  describe('maintain roles', () => {
    it('should create an action to save maintain roles user list', () => {
      const list = [{ firstName: 'Jack', surname: 'Brown' }]
      const expectedAction = {
        type: SET_USER_SEARCH_RESULTS_LIST,
        userList: list,
      }
      expect(actions.setMaintainRolesUserList(list)).toEqual(expectedAction)
    })

    it('should create an action to save maintain roles role list', () => {
      const list = [{ roleCode: 'Jack' }, { roleCode: 'Jill' }]
      const expectedAction = {
        type: SET_USER_SEARCH_ROLE_LIST,
        roleList: list,
      }
      expect(actions.setMaintainRolesRoleList(list)).toEqual(expectedAction)
    })

    it('should create an action to save maintain roles role filter list', () => {
      const list = [{ roleCode: 'Jack' }, { roleCode: 'Jill' }]
      const expectedAction = {
        type: SET_USER_SEARCH_ROLE_FILTER_LIST,
        roleFilterList: list,
      }
      expect(actions.setMaintainRolesRoleFilterList(list)).toEqual(expectedAction)
    })

    it('should create an action to save a maintain roles name filter', () => {
      const expectedAction = {
        type: SET_USER_SEARCH_NAME_FILTER,
        nameFilter: 'aField',
      }
      expect(actions.setMaintainRolesNameFilter('aField')).toEqual(expectedAction)
    })

    it('should create an action to save a maintain roles role filter', () => {
      const expectedAction = {
        type: SET_USER_SEARCH_ROLE_FILTER,
        roleFilter: 'aField',
      }
      expect(actions.setMaintainRolesRoleFilter('aField')).toEqual(expectedAction)
    })

    it('should create an action to save a maintain roles add role', () => {
      const expectedAction = {
        type: SET_USER_SEARCH_ROLE_ADD,
        roleAdd: 'aField',
      }
      expect(actions.setMaintainRolesRoleAdd('aField')).toEqual(expectedAction)
    })
    it('should create an action to save user search page size', () => {
      const expectedAction = {
        type: SET_USER_SEARCH_PAGINATION_PAGE_SIZE,
        pageSize: 4,
      }
      expect(actions.setMaintainRolesUserPageSize(4)).toEqual(expectedAction)
    })

    it('should create an action to save user search page number', () => {
      const expectedAction = {
        type: SET_USER_SEARCH_PAGINATION_PAGE_NUMBER,
        pageNumber: 6,
      }
      expect(actions.setMaintainRolesUserPageNumber(6)).toEqual(expectedAction)
    })

    it('should create an action to save user search total records', () => {
      const expectedAction = {
        type: SET_USER_SEARCH_PAGINATION_TOTAL_RECORDS,
        totalRecords: 6,
      }
      expect(actions.setMaintainRolesUserTotalRecords(6)).toEqual(expectedAction)
    })
  })
})
