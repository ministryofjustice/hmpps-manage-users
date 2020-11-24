import React from 'react'
import { shallow } from 'enzyme'
import { StaffRoleProfile } from './StaffRoleProfile'
import mockHistory from '../../../test/mockHistory'

const ROLE_DESCRIPTION_COLUMN = 0

describe('Staff role profile component', () => {
  it('should render the initial view of the Staff role profile', async () => {
    const component = shallow(
      <StaffRoleProfile
        roleList={[
          { roleCode: 'ROLE_1', roleName: 'Role 1', roleFunction: '', roleId: 1 },
          { roleCode: 'ROLE_2', roleName: 'Role 2', roleFunction: '', roleId: 2 },
        ]}
        agencyId="LEI"
        displayBack={jest.fn()}
        handleRemove={jest.fn()}
        error=""
        resetErrorDispatch={jest.fn()}
        history={mockHistory}
        message=""
        contextUser={{ username: 'joe' }}
      />
    )
    expect(component.find('#add-button').text()).toEqual('Add another role')
    expect(component.find('.removeButton').length).toEqual(2)
    expect(component.find('tr').at(1).find('td').at(ROLE_DESCRIPTION_COLUMN).text()).toEqual('Role 1')
  })
})
