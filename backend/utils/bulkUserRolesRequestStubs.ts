const requestOneId = 'fc43bc0b-82a3-488c-ae3b-c5a20d3777e6'
const requestTwoId = '2d2fc699-31fc-4daf-9301-e1deddd2f339'
const requestThreeId = '676b39b7-a022-4c31-a072-a0efffc79a98'

const bulkUserRolesRequestsList = [
  {
    id: requestOneId,
    jiraReference: 'HAAR-5398',
    requestedBy: 'A Aaronson',
    requestDateTime: new Date(2026, 0, 1, 12, 0, 0, 0),
    status: 'In Progress',
    errorStatus: 'N/A',
    roles: [
      {
        roleName: 'Role One',
        roleCode: 'ROLE_ONE',
      },
    ],
  },
  {
    id: requestTwoId,
    jiraReference: 'HAAR-5391',
    requestedBy: 'B Bieber',
    requestDateTime: new Date(2025, 1, 1, 13, 1, 0, 0),
    status: 'Complete',
    errorStatus: 'No Errors',
    roles: [
      {
        roleName: 'Role One',
        roleCode: 'ROLE_ONE',
      },
      {
        roleName: 'Role Two',
        roleCode: 'ROLE_TWO',
      },
    ],
  },
  {
    id: requestThreeId,
    jiraReference: 'HAAR-5388',
    requestedBy: 'C Caesar',
    requestDateTime: new Date(2024, 2, 2, 14, 2, 0, 0),
    status: 'Complete',
    errorStatus: 'Errors',
    roles: [
      {
        roleName: 'Role One',
        roleCode: 'ROLE_ONE',
      },
      {
        roleName: 'Role Two',
        roleCode: 'ROLE_TWO',
      },
      {
        roleName: 'Role Three',
        roleCode: 'ROLE_THREE',
      },
    ],
  },
]

const resultsList = [
  { user: 'AAA111', roleCode: 'ROLE_ONE', status: 200 },
  { user: 'AAA111', roleCode: 'ROLE_TWO', status: 200 },
  { user: 'AAA111', roleCode: 'ROLE_THREE', status: 200 },
  { user: 'BBB222', roleCode: 'ROLE_ONE', status: 200 },
  { user: 'BBB222', roleCode: 'ROLE_TWO', status: 404 },
  { user: 'BBB222', roleCode: 'ROLE_THREE', status: 409 },
  { user: 'CCC333', roleCode: 'ROLE_ONE', status: 404 },
  { user: 'CCC333', roleCode: 'ROLE_TWO', status: 404 },
  { user: 'CCC333', roleCode: 'ROLE_THREE', status: 404 },
  { user: 'DDD4444', roleCode: 'ROLE_ONE', status: 200 },
  { user: 'DDD4444', roleCode: 'ROLE_TWO', status: 409 },
  { user: 'DDD4444', roleCode: 'ROLE_THREE', status: 409 },
]

const bulkUserRolesReportsMap = () => {
  const m = new Map()
  m.set(requestOneId, [
    {
      user: 'AAA111',
      role: 'ROLE_ONE',
      status: 200,
    },
    {
      user: 'AAA111',
      role: 'ROLE_TWO',
      status: 200,
    },
    {
      user: 'AAA111',
      role: 'ROLE_THREE',
      status: 200,
    },
  ])
  m.set(requestTwoId, [
    {
      user: 'BBB222',
      role: 'ROLE_ONE',
      status: 200,
    },
    {
      user: 'BBB222',
      role: 'ROLE_TWO',
      status: 404,
    },
    {
      user: 'BBB222',
      role: 'ROLE_THREE',
      status: 409,
    },
  ])
  m.set(requestThreeId, [
    {
      user: 'CCC333',
      role: 'ROLE_ONE',
      status: 404,
    },
    {
      user: 'CCC333',
      role: 'ROLE_TWO',
      status: 409,
    },
    {
      user: 'CCC333',
      role: 'ROLE_THREE',
      status: 500,
    },
  ])
  return m
}

const getAggregatedResults = () => {
  const roleAssignmentResults = new Map()
  resultsList.forEach((assignment) => {
    if (roleAssignmentResults.has(assignment.roleCode)) {
      const aggregate = roleAssignmentResults.get(assignment.roleCode) as Aggregate
      aggregate.update(assignment.status)
      roleAssignmentResults.set(assignment.roleCode, aggregate)
    } else {
      roleAssignmentResults.set(assignment.roleCode, new Aggregate(assignment.status))
    }
  })
  return roleAssignmentResults
}

class Aggregate {
  private success: number

  private userNotFound: number

  private alreadyAssignedRole: number

  private error: number

  constructor(status: number) {
    this.success = 0
    this.userNotFound = 0
    this.alreadyAssignedRole = 0
    this.error = 0
    this.update(status)
  }

  update = (status: number) => {
    switch (status) {
      case 200:
        this.success += 1
        break
      case 404:
        this.userNotFound += 1
        break
      case 409:
        this.alreadyAssignedRole += 1
        break
      default:
        this.error += 1
    }
  }
}

module.exports = { bulkUserRolesRequestsList, bulkUserRolesReportsMap, getAggregatedResults }
