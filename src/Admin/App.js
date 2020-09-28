/* eslint-disable jsx-a11y/click-events-have-key-events */
import React from 'react'
import { FooterContainer, Header } from 'new-nomis-shared-components'
import { BrowserRouter as Router, Link, Redirect, Route, Switch } from 'react-router-dom'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import ReactGA from 'react-ga'
import UnauthPage from './unauthPage'
import AuthUserAddGroupContainer from './MaintainAuthUsers/containers/AuthUserAddGroupContainer'
import AuthUserContainer from './MaintainAuthUsers/containers/AuthUserContainer'
import AuthUserCreateContainer from './MaintainAuthUsers/containers/AuthUserCreateContainer'
import AuthUserAmendContainer from './MaintainAuthUsers/containers/AuthUserAmendContainer'
import AuthUserSearchContainer from './MaintainAuthUsers/containers/AuthUserSearchContainer'
import AuthUserSearchResultsContainer from './MaintainAuthUsers/containers/AuthUserSearchResultsContainer'
import UserSearchContainer from './MaintainRoles/containers/UserSearchContainer'
import UserSearchResultsContainer from './MaintainRoles/containers/UserSearchResultsContainer'
import StaffRoleProfileContainer from './MaintainRoles/containers/StaffRoleProfileContainer'
import AddRoleContainer from './MaintainRoles/containers/AddRoleContainer'
import Error from '../Error'
import links from '../links'
import { resetError, setConfig, setError, setLoaded, setMenuOpen, setMessage, setUserDetails } from '../redux/actions'
import { configType, errorType, userType } from '../types'

const axios = require('axios')

class App extends React.Component {
  async componentDidMount() {
    const { configDispatch, setErrorDispatch } = this.props

    axios.interceptors.response.use(
      (config) => {
        if (config.status === 205) {
          // eslint-disable-next-line no-alert
          alert(
            "There is a newer version of this website available, click ok to ensure you're using the latest version."
          )
          window.location = '/auth/logout'
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    try {
      await this.loadUser()
      const config = await axios.get('/api/config')
      links.notmEndpointUrl = config.data.notmEndpointUrl

      if (config.data.googleAnalyticsId) {
        ReactGA.initialize(config.data.googleAnalyticsId)
      }

      configDispatch(config.data)
    } catch (error) {
      setErrorDispatch(error.message)
    }
  }

  loadUser = async () => {
    const { userDetailsDispatch } = this.props
    const user = await axios.get('/api/me')
    userDetailsDispatch({ ...user.data })
  }

  clearMessage = () => {
    const { setMessageDispatch } = this.props
    setMessageDispatch('')
  }

  resetError = () => {
    const { resetErrorDispatch } = this.props
    resetErrorDispatch()
  }

  handleError = (error) => {
    const { setErrorDispatch } = this.props

    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data &&
      error.response.data.reason === 'session-expired'
    ) {
      this.displayAlertAndLogout('Your session has expired, please click OK to be redirected back to the login page')
    } else {
      setErrorDispatch((error.response && error.response.data) || `Something went wrong: ${error}`)
    }
  }

  displayAlertAndLogout = (message) => {
    alert(message) // eslint-disable-line no-alert
    window.location = '/auth/logout'
  }

  shouldDisplayInnerContent = () => {
    const { user } = this.props
    return user && user.username
  }

  displayBack = () => (
    <div className="padding-top">
      <Link id="back_to_menu_link" title="Back to menu link" className="link backlink" to="/">
        <img className="back-triangle" src="/images/BackTriangle.png" alt="" width="6" height="10" /> Back
      </Link>
    </div>
  )

  render() {
    const { menuOpen, boundSetMenuOpen, config, error, user, dispatchLoaded } = this.props

    const hasAdminUtilities =
      user && (user.maintainAccess || user.maintainAccessAdmin || user.maintainAuthUsers || user.groupManager)

    let innerContent
    const routes = (
      // eslint-disable-next-line
      <div
        className="inner-content"
        onClick={() => {
          if (menuOpen) {
            boundSetMenuOpen(false)
          }
        }}
      >
        <div className="pure-g">
          <Switch>
            {!hasAdminUtilities && <Route exact path="/" render={() => <Redirect to="/unauthorised" />} />}
            <Route exact path="/unauthorised" render={() => <UnauthPage dispatchLoaded={dispatchLoaded} />} />

            <Route
              exact
              path="/maintain-roles"
              render={() => (
                <UserSearchContainer
                  displayBack={this.displayBack}
                  handleError={this.handleError}
                  clearMessage={this.clearMessage}
                />
              )}
            />
            <Route
              exact
              path="/maintain-roles/search-results"
              render={() => (
                <UserSearchResultsContainer
                  displayBack={this.displayBack}
                  handleError={this.handleError}
                  clearMessage={this.clearMessage}
                />
              )}
            />
            <Route
              exact
              path="/maintain-roles/:username/roles"
              render={() => (
                <StaffRoleProfileContainer
                  displayBack={this.displayBack}
                  handleError={this.handleError}
                  clearMessage={this.clearMessage}
                />
              )}
            />
            <Route
              exact
              path="/maintain-roles/:username/roles/add-role"
              render={() => (
                <AddRoleContainer
                  displayBack={this.displayBack}
                  handleError={this.handleError}
                  clearMessage={this.clearMessage}
                />
              )}
            />
            <Route exact path="/maintain-auth-users" render={() => <AuthUserSearchContainer />} />
            <Route exact path="/maintain-auth-users/search-results" render={() => <AuthUserSearchResultsContainer />} />
            <Route exact path="/maintain-auth-users/:username" render={() => <AuthUserContainer />} />
            <Route exact path="/maintain-auth-users/:username/add-group" render={() => <AuthUserAddGroupContainer />} />
            <Route exact path="/maintain-auth-users/:username/amend" render={() => <AuthUserAmendContainer />} />
            <Route exact path="/create-auth-user" render={() => <AuthUserCreateContainer />} />
          </Switch>
        </div>
      </div>
    )

    if (this.shouldDisplayInnerContent()) {
      innerContent = routes
    } else {
      innerContent = (
        // eslint-disable-next-line
        <div className="inner-content" onClick={() => boundSetMenuOpen(false)}>
          <div className="pure-g">
            <Error error={error} />
          </div>
        </div>
      )
    }

    return (
      <Router>
        <div className="content">
          <Route
            render={(props) => {
              if (config.googleAnalyticsId) {
                ReactGA.pageview(props.location.pathname)
              }

              return (
                <Header
                  homeLink={links.getHomeLink()}
                  logoText="HMPPS"
                  title="Digital Prison Services"
                  user={user}
                  menuOpen={menuOpen}
                  setMenuOpen={boundSetMenuOpen}
                />
              )
            }}
          />
          {innerContent}
          <FooterContainer supportUrl={config.supportUrl} prisonStaffHubUrl={`${config.dpsEndpointUrl}/`} />
        </div>
      </Router>
    )
  }
}

App.propTypes = {
  error: errorType.isRequired,
  config: configType.isRequired,
  user: userType.isRequired,
  configDispatch: PropTypes.func.isRequired,
  userDetailsDispatch: PropTypes.func.isRequired,
  setErrorDispatch: PropTypes.func.isRequired,
  resetErrorDispatch: PropTypes.func.isRequired,
  setMessageDispatch: PropTypes.func.isRequired,
  menuOpen: PropTypes.bool.isRequired,
  boundSetMenuOpen: PropTypes.func.isRequired,
  dispatchLoaded: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
  error: state.app.error,
  config: state.app.config,
  user: state.app.user,
  menuOpen: state.app.menuOpen,
})

const mapDispatchToProps = (dispatch) => ({
  configDispatch: (config) => dispatch(setConfig(config)),
  userDetailsDispatch: (user) => dispatch(setUserDetails(user)),
  setErrorDispatch: (error) => dispatch(setError(error)),
  resetErrorDispatch: () => dispatch(resetError()),
  setMessageDispatch: (message) => dispatch(setMessage(message)),
  boundSetMenuOpen: (flag) => dispatch(setMenuOpen(flag)),
  dispatchLoaded: (value) => dispatch(setLoaded(value)),
})

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(App)

export { App, AppContainer }
export default App
