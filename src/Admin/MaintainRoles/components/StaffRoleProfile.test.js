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
        handleAdd={jest.fn()}
        error=""
        resetErrorDispatch={jest.fn()}
        history={mockHistory}
        message=""
      />
    )
    expect(component.find('#add-button').text()).toEqual('Add another role')
    expect(component.find('.removeButton').length).toEqual(2)
    expect(component.find('tr').at(1).find('td').at(ROLE_DESCRIPTION_COLUMN).text()).toEqual('Role 1')
  })

  it('should handle updates', async () => {
    const handleRemoveMock = jest.fn()
    const handleAddMock = jest.fn()
    const component = shallow(
      <StaffRoleProfile
        roleList={[
          { roleCode: 'ROLE_1', roleName: 'Role 1', roleFunction: '', roleId: 1 },
          { roleCode: 'ROLE_2', roleName: 'Role 2', roleFunction: '', roleId: 2 },
        ]}
        agencyId="LEI"
        displayBack={jest.fn()}
        handleRemove={handleRemoveMock}
        handleAdd={handleAddMock}
        error=""
        resetErrorDispatch={jest.fn()}
        history={mockHistory}
        message=""
      />
    )
    component.find('#add-button').simulate('click')
    expect(handleAddMock).toHaveBeenCalled()
    component.find('#remove-button-ROLE_2').simulate('click')
    expect(handleRemoveMock).toHaveBeenCalled()
  })
})
