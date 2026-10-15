import type { Request, Response } from 'express'
import restrictedRolesMiddleware from './restrictedRolesMiddleware'
import DpsUserService from '../../services/dpsUserService'
import RolesService from '../../services/rolesService'
import { Services } from '../../services'
import { RestrictedRoles } from '../../presentation/restrictedRoles'
import { HmppsUser } from '../../interfaces/hmppsUser'

jest.mock('../../services/dpsUserService')
jest.mock('../../services/rolesService')
jest.mock('../../services')
describe('Restricted roles middleware', () => {
  const rolesService: jest.Mocked<RolesService> = new RolesService({} as never) as jest.Mocked<RolesService>
  rolesService.getRoles = jest
    .fn()
    .mockImplementation(async (_token: string, adminType: 'DPS_LSA' | 'DPS_ADM' | 'EXT_ADM' | 'IMS_HIDDEN') => {
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
    })
  const dpsUserService: jest.Mocked<DpsUserService> = new DpsUserService({} as never) as jest.Mocked<DpsUserService>
  dpsUserService.getDpsUser = jest.fn().mockImplementation(async (_token: string, username: string) => {
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
  })
  const services: jest.Mocked<Services> = {
    dpsUserService,
    rolesService,
  } as unknown as Services

  const req = {} as Request
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

  function createResponse(username: string, authSource: string): Response {
    return {
      locals: {
        user: {
          token,
          username,
          authSource,
        } as HmppsUser,
      },
    } as unknown as Response
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not add restricted roles if auth source is not nomis', async () => {
    const res = createResponse('TEST-USER', 'auth')

    await restrictedRolesMiddleware(services)(req, res, next)

    expect(dpsUserService.getDpsUser).not.toHaveBeenCalled()
    expect(rolesService.getRoles).not.toHaveBeenCalled()
    expect(res.locals.restrictedRoles).toBe(undefined)
  })

  it('should add DPS_ADM only restricted role codes for an LSA if auth source is nomis', async () => {
    const res = createResponse('TADMIN_LSA', 'nomis')

    await restrictedRolesMiddleware(services)(req, res, next)

    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'DPS_ADM')
    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'DPS_LSA')
    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'IMS_HIDDEN')
    expect(dpsUserService.getDpsUser).toHaveBeenCalledWith(token, 'TADMIN_LSA')
    expect(res.locals.restrictedRoles).toContainEqual(expectedDpsAdminOnlyRestrictedRoles)
  })

  it('should add IMS_HIDDEN restricted role codes for an LSA if auth source is nomis', async () => {
    const res = createResponse('TADMIN_LSA', 'nomis')

    await restrictedRolesMiddleware(services)(req, res, next)

    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'DPS_ADM')
    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'DPS_LSA')
    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'IMS_HIDDEN')
    expect(dpsUserService.getDpsUser).toHaveBeenCalledWith(token, 'TADMIN_LSA')
    expect(res.locals.restrictedRoles).toContainEqual(expectedImsAdminRestrictedRoles)
  })

  it('should add IMS_HIDDEN restricted role codes for an DPS Central Admin if auth source is nomis', async () => {
    const res = createResponse('TADMIN_ADM', 'nomis')

    await restrictedRolesMiddleware(services)(req, res, next)

    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'DPS_ADM')
    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'DPS_LSA')
    expect(rolesService.getRoles).toHaveBeenCalledWith(token, 'IMS_HIDDEN')
    expect(dpsUserService.getDpsUser).toHaveBeenCalledWith(token, 'TADMIN_ADM')
    expect(res.locals.restrictedRoles).toContainEqual(expectedImsAdminRestrictedRoles)
  })
})
