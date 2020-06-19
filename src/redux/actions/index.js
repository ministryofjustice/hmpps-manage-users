import {
  RESET_ERROR,
  RESET_VALIDATION_ERRORS,
  SET_CONFIG,
  SET_ERROR,
  SET_LOADED,
  SET_MENU_OPEN,
  SET_MESSAGE,
  SET_TERMS_VISIBILITY,
  SET_USER_DETAILS,
  SET_USER_SEARCH_CONTEXT_USER,
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

export const setConfig = config => ({ type: SET_CONFIG, config })

export const setUserDetails = user => ({ type: SET_USER_DETAILS, user })

export const setTermsVisibility = shouldShowTerms => ({ type: SET_TERMS_VISIBILITY, shouldShowTerms })

export const setError = error => ({ type: SET_ERROR, error })
export const resetError = error => ({ type: RESET_ERROR })
export const handleAxiosError = error => dispatch => {
  if (
    error.response &&
    error.response.status === 401 &&
    error.response.data &&
    error.response.data.reason === 'session-expired'
  ) {
    // eslint-disable-next-line no-alert
    alert('Your session has expired, please click OK to be redirected back to the login page')
    window.location = '/auth/logout'
  } else {
    dispatch(setError((error.response && error.response.data) || `Something went wrong: ${error}`))
  }
}

export const setMessage = message => ({ type: SET_MESSAGE, message })
export const clearMessage = () => ({ type: SET_MESSAGE, message: '' })

export const setLoaded = loaded => ({ type: SET_LOADED, loaded })

export const setValidationError = (fieldName, message) => ({ type: SET_VALIDATION_ERROR, fieldName, message })
export const resetValidationErrors = () => ({ type: RESET_VALIDATION_ERRORS })

export const setMenuOpen = payload => ({ type: SET_MENU_OPEN, payload })

export const setMaintainRolesUserList = userList => ({ type: SET_USER_SEARCH_RESULTS_LIST, userList })
export const setMaintainRolesRoleList = roleList => ({ type: SET_USER_SEARCH_ROLE_LIST, roleList })
export const setMaintainRolesRoleFilterList = roleFilterList => ({
  type: SET_USER_SEARCH_ROLE_FILTER_LIST,
  roleFilterList,
})
export const setMaintainRolesNameFilter = nameFilter => ({ type: SET_USER_SEARCH_NAME_FILTER, nameFilter })
export const setMaintainRolesRoleFilter = roleFilter => ({ type: SET_USER_SEARCH_ROLE_FILTER, roleFilter })
export const setMaintainRolesRoleAdd = roleAdd => ({ type: SET_USER_SEARCH_ROLE_ADD, roleAdd })
export const setMaintainRolesUserPageNumber = pageNumber => ({
  type: SET_USER_SEARCH_PAGINATION_PAGE_NUMBER,
  pageNumber,
})
export const setMaintainRolesUserPageSize = pageSize => ({ type: SET_USER_SEARCH_PAGINATION_PAGE_SIZE, pageSize })
export const setMaintainRolesUserTotalRecords = totalRecords => ({
  type: SET_USER_SEARCH_PAGINATION_TOTAL_RECORDS,
  totalRecords,
})
export const setMaintainRolesUserContextUser = contextUser => ({ type: SET_USER_SEARCH_CONTEXT_USER, contextUser })
