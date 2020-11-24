import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ReactRouterPropTypes from 'react-router-prop-types'
import { withRouter } from 'react-router'
import Link from '@govuk-react/link'
import Button from '@govuk-react/button'
import { Link as RouterLink } from 'react-router-dom'
import { contextUserType, roleListType } from '../../../types'
import ButtonContainer from '../../../Components/ButtonContainer/ButtonContainer'

class StaffRoleProfile extends Component {
  goBack = (e, history) => {
    e.preventDefault()
    // Return to previous page in history. There can be multiple origin pages.
    history.goBack()
  }

  render() {
    const { roleList, history, contextUser, handleRemove } = this.props
    const results = roleList.map((a) => (
      <tr key={a.roleCode}>
        <td className="row-gutters">{a.roleName}</td>
        <td className="row-gutters">
          <button
            type="button"
            className="button greyButtonNoMinWidth removeButton"
            id={`remove-button-${a.roleCode}`}
            value={a.roleCode}
            onClick={(event) => {
              handleRemove(event, history)
            }}
          >
            Delete role
          </button>
        </td>
      </tr>
    ))

    return (
      <div className="padding-bottom-large">
        <div className="pure-g">
          <div className="pure-u-md-11-12 ">
            <div className="pure-u-md-7-12">
              <div className="padding-bottom-40">
                <table>
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {results.length > 0 ? (
                      results
                    ) : (
                      <tr>
                        <td className="padding-left font-small row-gutters no-results-row">No roles found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <ButtonContainer>
                <Button id="add-button" as={Link} href={`/manage-dps-users/${contextUser.username}/select-roles`}>
                  Add another role
                </Button>
                <Link as={RouterLink} className="link padding-left" title="Search for a user" to="/maintain-roles">
                  Search for a user
                </Link>
              </ButtonContainer>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

StaffRoleProfile.propTypes = {
  history: ReactRouterPropTypes.history.isRequired,
  roleList: roleListType.isRequired,
  contextUser: contextUserType.isRequired,
  handleRemove: PropTypes.func.isRequired,
}

const StaffRoleProfileWithRouter = withRouter(StaffRoleProfile)

export { StaffRoleProfile }
export default StaffRoleProfileWithRouter
