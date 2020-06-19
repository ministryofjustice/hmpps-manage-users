import React from 'react'
import { shallow } from 'enzyme'
import App from './App'
import mockHistory from '../test/mockHistory'

jest.mock('../Spinner/index', () => '')

const config = {
  notmEndpointUrl: '/notm/endpoint',
  mailTo: 'email@test.com',
}

const user = {
  expiredFlag: false,
  firstName: 'Test',
  lastName: 'User',
  lockedFlag: false,
  maintainAccess: false,
  maintainAccessAdmin: false,
  staffId: 1,
  username: 'TestUser',
}

const props = {
  switchCaseLoad: jest.fn(),
  config,
  user,
  history: mockHistory,
  setErrorDispatch: jest.fn(),
  userDetailsDispatch: jest.fn(),
  configDispatch: jest.fn(),
  setMessageDispatch: jest.fn(),
  menuOpen: false,
  boundSetMenuOpen: jest.fn(),
  setTermsVisibilityDispatch: jest.fn(),
  error: '',
  page: 0,
  shouldShowTerms: false,
  resetErrorDispatch: jest.fn(),
  message: '',
  allowAuto: false,
  migrated: false,
  dispatchLoaded: jest.fn(),
}

describe('App component', () => {
  it('should handle session timeout error response and display alert', async () => {
    const component = shallow(<App {...props} />)
    const appInstance = component.instance()
    appInstance.displayAlertAndLogout = jest.fn()
    appInstance.handleError({
      response: { status: 401, data: { message: 'Session expired', reason: 'session-expired' } },
    })
    expect(component.instance().displayAlertAndLogout).toBeCalledWith(
      'Your session has expired, please click OK to be redirected back to the login page'
    )

    appInstance.displayAlertAndLogout = jest.fn()
    appInstance.handleError({ response: { status: 401, data: { message: 'another 401' } } })
    expect(component.instance().displayAlertAndLogout).not.toBeCalled()

    appInstance.displayAlertAndLogout = jest.fn()
    appInstance.handleError({ response: { status: 400 } })
    expect(component.instance().displayAlertAndLogout).not.toBeCalled()

    appInstance.displayAlertAndLogout = jest.fn()
    appInstance.handleError({})
    expect(component.instance().displayAlertAndLogout).not.toBeCalled()
  })

  it('should handle non-session timout error responses without the session timeout alert', async () => {
    const component = shallow(<App {...props} />)
    const appInstance = component.instance()
    appInstance.displayAlertAndLogout = jest.fn()
    appInstance.handleError({ response: { status: 401, data: { message: 'another 401' } } })
    expect(component.instance().displayAlertAndLogout).not.toBeCalled()

    appInstance.displayAlertAndLogout = jest.fn()
    appInstance.handleError({ response: { status: 400 } })
    expect(component.instance().displayAlertAndLogout).not.toBeCalled()

    appInstance.displayAlertAndLogout = jest.fn()
    appInstance.handleError({})
    expect(component.instance().displayAlertAndLogout).not.toBeCalled()
  })

  it('should not do anything if the menu is not open when the content is clicked', () => {
    const setMenuOpen = jest.fn()
    props.boundSetMenuOpen = setMenuOpen
    props.menuOpen = false

    const component = shallow(<App {...props} />)

    component.find('.inner-content').simulate('click')

    expect(setMenuOpen).not.toHaveBeenCalledWith(false)
  })

  it('should close the menu when the content is clicked', () => {
    const setMenuOpen = jest.fn()
    props.boundSetMenuOpen = setMenuOpen
    props.menuOpen = true

    const component = shallow(<App {...props} />)

    component.find('.inner-content').simulate('click')

    expect(setMenuOpen).toHaveBeenCalledWith(false)
  })

  it('should pass through correct props to the footer container', () => {
    const component = shallow(<App {...props} />)

    expect(component.find({ feedbackEmail: config.mailTo }).prop('prisonStaffHubUrl')).toEqual(config.prisonStaffHubUrl)
  })
})
