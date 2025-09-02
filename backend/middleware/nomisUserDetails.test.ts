import type { Request, Response } from 'express'
import nomisUserDetails from './nomisUserDetails'
import { manageUsersApiBuilder, ManageUsersApiClient } from '../data'
import { PrisonUserDetails } from '../@types/manageUsersApi'
import { RestrictedRoles } from '../services/restrictedRolesService'

jest.mock('../data', () => ({
  __esModule: true,
  ManageUsersApiClient: jest.fn().mockImplementation(() => {
    return {
      getRoles: jest.fn().mockImplementation((adminType) => {
        if (adminType === 'DPS_ADM') {
          return [
            {
              roleCode: 'DPS_AND_LSA_ROLE',
              roleName: 'DPS and LSA Role',
              roleDescription: 'DPS and LSA Role',
              adminType: [
                {
                  adminTypeCode: 'DPS_ADM',
                  adminTypeName: 'DPS Central Administrator',
                },
                {
                  adminTypeCode: 'DPS_LSA',
                  adminTypeName: 'Local Administrator',
                },
              ],
            },
            {
              roleCode: 'DPS_ADM_ONLY_ROLE',
              roleName: 'DPS Admin only role',
              roleDescription: 'DPS Admin only role',
              adminType: [
                {
                  adminTypeCode: 'DPS_ADM',
                  adminTypeName: 'DPS Central Administrator',
                },
              ],
            },
            {
              roleCode: 'ANOTHER_DPS_ADM_ONLY_ROLE',
              roleName: 'Another DPS Admin only role',
              roleDescription: 'Another DPS Admin only role',
              adminType: [
                {
                  adminTypeCode: 'DPS_ADM',
                  adminTypeName: 'DPS Central Administrator',
                },
              ],
            },
          ]
        }
        if (adminType === 'DPS_LSA') {
          return [
            {
              roleCode: 'DPS_AND_LSA_ROLE',
              roleName: 'DPS and LSA Role',
              roleDescription: 'DPS and LSA Role',
              adminType: [
                {
                  adminTypeCode: 'DPS_ADM',
                  adminTypeName: 'DPS Central Administrator',
                },
                {
                  adminTypeCode: 'DPS_LSA',
                  adminTypeName: 'Local Administrator',
                },
              ],
            },
            {
              roleCode: 'LSA_ONLY_ROLE',
              roleName: 'LSA only role',
              roleDescription: 'LSA only role',
              adminType: [
                {
                  adminTypeCode: 'DPS_LSA',
                  adminTypeName: 'Local Administrator',
                },
              ],
            },
          ]
        }
        if (adminType === 'IMS_HIDDEN') {
          return [
            {
              roleCode: 'IMS_ROLE',
              roleName: 'IMS role',
              roleDescription: 'IMS role',
              adminType: [
                {
                  adminTypeCode: 'IMS_HIDDEN',
                  adminTypeName: 'IMS Administrator',
                },
              ],
            },
          ]
        }
        return []
      }),
      getDpsUser: jest.fn().mockImplementation((username): PrisonUserDetails => {
        if (username === 'TADMIN_ADM') {
          return {
            accountType: 'ADMIN',
            active: true,
            authSource: 'nomis',
            enabled: true,
            firstName: 'Test',
            lastName: 'Central Admin',
            name: 'Test Central Admin',
            staffId: 1234,
            userId: 1234,
            username,
          }
        }
        if (username === 'TADMIN_LSA') {
          return {
            accountType: 'ADMIN',
            active: true,
            authSource: 'nomis',
            enabled: true,
            firstName: 'Test',
            lastName: 'Local Admin',
            name: 'Test Local Admin',
            staffId: 2345,
            userId: 2345,
            username,
            administratorOfUserGroups: [
              {
                id: 'DMI',
                name: 'DURHAM (HMP) LAA',
              },
            ],
          }
        }
        return {
          accountType: 'GENERAL',
          active: true,
          authSource: 'nomis',
          enabled: true,
          firstName: 'Test',
          lastName: 'User',
          name: ' Test User',
          staffId: 3456,
          userId: 3456,
          username,
        }
      }),
    }
  }),
  manageUsersApiBuilder: jest.fn().mockImplementation((token) => {
    return new ManageUsersApiClient(token)
  }),
}))

describe('nomisUserDetails middleware', () => {
  const mockedManageUsersApiBuilder = manageUsersApiBuilder as jest.MockedFunction<typeof manageUsersApiBuilder>
  const next = jest.fn()
  const token = 'TEST-TOKEN'
  const expectedDpsAdminOnlyRestrictedRoles: RestrictedRoles = {
    removalMessage:
      'This role is centrally managed, please raise a <a class="govuk-link" href="#">Service Now ticket</a> to get this role removed.',
    roleCodes: ['DPS_ADM_ONLY_ROLE', 'ANOTHER_DPS_ADM_ONLY_ROLE'],
  }
  const expectedImsAdminRestrictedRoles: RestrictedRoles = {
    removalMessage:
      'If you require a users access to be removed from the Intelligence Management Service (IMS), the Head of Security (Prison roles) or Head of Unit (HQ roles) must contact <a class="govuk-link" href="mailto:nisst@justice.gov.uk">nisst@justice.gov.uk</a> directly.',
    roleCodes: ['IMS_ROLE'],
  }

  const createRequest = (username: string) => {
    return {
      session: {
        userDetails: {
          username,
        },
      },
    } as unknown as Request
  }

  function createResponse(authSource: string): Response {
    return {
      locals: {
        authSource,
        access_token: token,
      },
    } as unknown as Response
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not add restricted roles if auth source is not nomis', async () => {
    const req = createRequest('TEST-USER')
    const res = createResponse('auth')

    await nomisUserDetails()(req, res, next)

    expect(mockedManageUsersApiBuilder).not.toHaveBeenCalled()
    expect(res.locals.restrictedRoleCodes).toBe(undefined)
  })

  it('should add DPS_ADM only restricted role codes for an LSA if auth source is nomis', async () => {
    const req = createRequest('TADMIN_LSA')
    const res = createResponse('nomis')

    await nomisUserDetails()(req, res, next)

    expect(mockedManageUsersApiBuilder).toHaveBeenCalledWith(token)
    expect(res.locals.restrictedRoles).toContainEqual(expectedDpsAdminOnlyRestrictedRoles)
  })

  it('should add IMS_HIDDEN restricted role codes for an LSA if auth source is nomis', async () => {
    const req = createRequest('TADMIN_LSA')
    const res = createResponse('nomis')

    await nomisUserDetails()(req, res, next)

    expect(mockedManageUsersApiBuilder).toHaveBeenCalledWith(token)
    expect(res.locals.restrictedRoles).toContainEqual(expectedImsAdminRestrictedRoles)
  })

  it('should add IMS_HIDDEN restricted role codes for an DPS Central Admin if auth source is nomis', async () => {
    const req = createRequest('TADMIN_ADM')
    const res = createResponse('nomis')

    await nomisUserDetails()(req, res, next)

    expect(mockedManageUsersApiBuilder).toHaveBeenCalledWith(token)
    expect(res.locals.restrictedRoles).toContainEqual(expectedImsAdminRestrictedRoles)
  })
})
