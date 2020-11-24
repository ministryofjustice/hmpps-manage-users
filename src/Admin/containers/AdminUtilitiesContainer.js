import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { setLoaded } from '../../redux/actions'
import Page from '../../Components/Page'
import { userType, configType } from '../../types'
import MessageBar from '../../MessageBar'
import { AdminUtilities, AdminUtility } from './AdminUtilitiesContainer.styles'

export class AdminUtilitiesContainer extends Component {
  componentWillMount() {
    const { setLoadedDispatch } = this.props

    setLoadedDispatch(true)
  }

  render() {
    const { user } = this.props
    const hasMaintainNomisRolesAccess = user && (user.maintainAccess || user.maintainAccessAdmin)
    const hasMaintainAuthUsers = user && (user.maintainAuthUsers || user.groupManager)

    return (
      <Page title="Manage user accounts">
        <MessageBar {...this.props} />
        <AdminUtilities>
          {!hasMaintainNomisRolesAccess && !hasMaintainNomisRolesAccess && !hasMaintainAuthUsers && (
            <div>
              <p>There are no admin functions associated with your account.</p>
            </div>
          )}
          {hasMaintainNomisRolesAccess && (
            <AdminUtility>
              <Link id="maintain_roles_link" title="Manage user roles" className="link" to="/maintain-roles">
                Manage user roles
              </Link>
            </AdminUtility>
          )}
          {hasMaintainAuthUsers && (
            <AdminUtility>
              <Link
                id="maintain_auth_users_link"
                title="Maintain external users"
                className="link"
                to="/maintain-external-users"
              >
                Maintain external users
              </Link>
              <div>Maintain users that do not exist in NOMIS, only in auth.</div>
            </AdminUtility>
          )}
          {hasMaintainAuthUsers && (
            <AdminUtility>
              <Link
                id="create_auth_user_link"
                title="Create external users"
                className="link"
                to="/create-external-user"
              >
                Create external users
              </Link>
              <div>Create user in auth (not in NOMIS).</div>
            </AdminUtility>
          )}
        </AdminUtilities>
      </Page>
    )
  }
}

AdminUtilitiesContainer.propTypes = {
  user: userType.isRequired,
  config: configType.isRequired,
  setLoadedDispatch: PropTypes.func.isRequired,
}

const mapStateToProps = (state) => ({
  user: state.app.user,
  config: state.app.config,
})

const mapDispatchToProps = (dispatch) => ({
  setLoadedDispatch: (status) => dispatch(setLoaded(status)),
})

export default connect(mapStateToProps, mapDispatchToProps)(AdminUtilitiesContainer)
