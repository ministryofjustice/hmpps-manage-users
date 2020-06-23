import { combineReducers } from 'redux'
import * as ActionTypes from '../actions/actionTypes'

const appInitialState = {
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

function updateObject(oldObject, newValues) {
  return Object.assign({}, oldObject, newValues)
}

export function app(state = appInitialState, action) {
  switch (action.type) {
    case ActionTypes.SET_CONFIG:
      return updateObject(state, {
        config: action.config,
      })
    case ActionTypes.SET_USER_DETAILS:
      return updateObject(state, {
        user: action.user,
      })
    case ActionTypes.SET_TERMS_VISIBILITY:
      return { ...state, shouldShowTerms: action.shouldShowTerms }

    case ActionTypes.SET_ERROR:
      return updateObject(state, {
        error: action.error,
      })
    case ActionTypes.RESET_ERROR:
      return updateObject(state, {
        error: '',
      })
    case ActionTypes.SET_MESSAGE:
      return {
        ...state,
        message: action.message,
      }
    case ActionTypes.SET_LOADED:
      return {
        ...state,
        loaded: action.loaded,
      }
    case ActionTypes.SET_VALIDATION_ERROR: {
      const newError = { [action.fieldName]: action.message }
      return {
        ...state,
        validationErrors: state.validationErrors ? { ...state.validationErrors, ...newError } : newError,
      }
    }
    case ActionTypes.RESET_VALIDATION_ERRORS:
      return {
        ...state,
        validationErrors: {},
      }
    case ActionTypes.SET_MENU_OPEN:
      return {
        ...state,
        menuOpen: action.payload,
      }
    default:
      return state
  }
}

export function maintainRoles(state = maintainRolesInitialState, action) {
  switch (action.type) {
    case ActionTypes.SET_USER_SEARCH_NAME_FILTER:
      return {
        ...state,
        nameFilter: action.nameFilter,
      }
    case ActionTypes.SET_USER_SEARCH_ROLE_FILTER:
      return {
        ...state,
        roleFilter: action.roleFilter,
      }
    case ActionTypes.SET_USER_SEARCH_ROLE_ADD:
      return {
        ...state,
        roleAdd: action.roleAdd,
      }
    case ActionTypes.SET_USER_SEARCH_RESULTS_LIST:
      return {
        ...state,
        userList: action.userList,
      }
    case ActionTypes.SET_USER_SEARCH_ROLE_LIST:
      return {
        ...state,
        roleList: action.roleList,
      }
    case ActionTypes.SET_USER_SEARCH_ROLE_FILTER_LIST:
      return {
        ...state,
        roleFilterList: action.roleFilterList,
      }
    case ActionTypes.SET_USER_SEARCH_PAGINATION_PAGE_SIZE:
      return {
        ...state,
        pageSize: action.pageSize,
      }
    case ActionTypes.SET_USER_SEARCH_PAGINATION_PAGE_NUMBER:
      return {
        ...state,
        pageNumber: action.pageNumber,
      }
    case ActionTypes.SET_USER_SEARCH_PAGINATION_TOTAL_RECORDS:
      return {
        ...state,
        totalRecords: action.totalRecords,
      }
    case ActionTypes.SET_USER_SEARCH_CONTEXT_USER:
      return {
        ...state,
        contextUser: action.contextUser,
      }
    default:
      return state
  }
}

export function maintainAuthUsers(state = maintainAuthUsersInitialState, action) {
  switch (action.type) {
    case ActionTypes.SET_AUTH_USER_SEARCH_RESULTS_LIST:
      return { ...state, userList: action.userList }
    case ActionTypes.SET_AUTH_USER_ROLE_LIST:
      return { ...state, roleList: action.roleList }
    case ActionTypes.SET_AUTH_USER_GROUP_LIST:
      return { ...state, groupList: action.groupList }
    case ActionTypes.SET_AUTH_USER_CONTEXT_USER:
      return { ...state, contextUser: action.contextUser }
    default:
      return state
  }
}

const allocationApp = combineReducers({
  app,
  maintainRoles,
  maintainAuthUsers,
})

export default allocationApp
