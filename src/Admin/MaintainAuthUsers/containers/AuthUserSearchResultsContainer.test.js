import React from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { shallow, mount } from 'enzyme'

import AuthUserSearchResultsContainer from './AuthUserSearchResultsContainer'

describe('Auth search results container', () => {
  it('should render correctly without existing location', () => {
    const wrapper = shallow(<AuthUserSearchResultsContainer location={{ search: {} }} />)
    expect(wrapper).toMatchSnapshot()
  })

  it('should render correctly with search location', () => {
    const wrapper = shallow(<AuthUserSearchResultsContainer location={{ search: { user: 'auser' } }} />)
    expect(wrapper).toMatchSnapshot()
  })

  describe('handle change and search', () => {
    const event = { target: { name: 'user', value: 'usersearched' }, preventDefault: jest.fn() }
    const store = { subscribe: jest.fn(), dispatch: jest.fn(), getState: jest.fn(), setState: jest.fn() }
    store.getState.mockReturnValue({
      app: { error: '', loaded: true },
      maintainAuthUsers: { userList: [] },
    })

    const wrapper = mount(
      <Provider store={store}>
        <MemoryRouter>
          <AuthUserSearchResultsContainer />
        </MemoryRouter>
      </Provider>
    )
    wrapper.find('input#user').simulate('change', event)

    it('should set the user input on the state', () => {
      expect(wrapper.find('AuthUserSearchHoc').state().user).toEqual('usersearched')
    })
  })
})
