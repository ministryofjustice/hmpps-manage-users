import { SQSClient } from '@aws-sdk/client-sqs'
import logger from '../../logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AuditService } = require('./auditService')

const adminId = 'some admin'
const userId = 'some user'
type AuditFunction = (message: object) => Promise<void>

describe('Audit service', () => {
  const auditService = new AuditService()
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('add role', () => {
    it('sends a roles added to user audit message', async () => {
      const auditMessage = { adminId, userId, roles: ['NEW_ROLE'], logErrors: true }
      const expectedWhat = 'ADD_USER_ROLES'
      const expectedWho = 'some admin'
      const expectedDetails = '{"adminId":"some admin","userId":"some user","roles":["NEW_ROLE"]}'
      await assertAuditMessageIsPublishedCorrectly(
        auditService.addRolesToUser.bind(auditService),
        auditMessage,
        expectedWhat,
        expectedWho,
        expectedDetails,
      )
    })

    it('logs out errors if logErrors is true when adding user roles', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.addRolesToUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        roles: ['NEW_ROLE'],
        logErrors: true,
      })
    })

    it('does not log out errors if logErrors is false for add roles to user', async () => {
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.addRolesToUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        roles: ['NEW_ROLE'],
        logErrors: false,
      })
    })
  })

  describe('remove role', () => {
    it('sends a role removed from user audit message', async () => {
      jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
      const auditMessage = {
        adminId: 'some admin',
        userId: 'some user',
        role: 'ROLE_TO_REMOVE',
        logErrors: true,
      }
      const expectedWhat = 'REMOVE_USER_ROLE'
      const expectedWho = 'some admin'
      const expectedDetails = '{"adminId":"some admin","userId":"some user","role":"ROLE_TO_REMOVE"}'

      await assertAuditMessageIsPublishedCorrectly(
        auditService.removeRoleFromUser.bind(auditService),
        auditMessage,
        expectedWhat,
        expectedWho,
        expectedDetails,
      )
    })

    it('logs out errors if logErrors is true when removing user role', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.removeRoleFromUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        role: 'ROLE_TO_REMOVE',
        logErrors: true,
      })
    })

    it('does not log out errors if logErrors is false for remove role from user', async () => {
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.removeRoleFromUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        role: 'ROLE_TO_REMOVE',
        logErrors: false,
      })
    })
  })

  describe('create group', () => {
    it('sends a group created from user audit message', async () => {
      jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
      const auditMessage = {
        adminId: 'some admin',
        userId: 'some user',
        group: { groupCode: 'TEST', groupName: 'test group' },
        logErrors: true,
      }
      const expectedWhat = 'CREATE_GROUP'
      const expectedDetails =
        '{"adminId":"some admin","userId":"some user","group":{"groupCode":"TEST","groupName":"test group"}}'

      await assertAuditMessageIsPublishedCorrectly(
        auditService.createGroup.bind(auditService),
        auditMessage,
        expectedWhat,
        adminId,
        expectedDetails,
      )
    })

    it('logs out errors if logErrors is true when creating group', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.createGroup.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        group: { groupCode: 'TEST', groupName: 'test group' },
        logErrors: true,
      })
    })

    it('does not log out errors if logErrors is false when creating group', async () => {
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.createGroup.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        group: { groupCode: 'TEST', groupName: 'test group' },
        logErrors: false,
      })
    })
  })

  describe('enable user', () => {
    it('sends a user enabled audit message', async () => {
      jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
      const auditMessage = {
        adminId: 'some admin',
        userId: 'some user',
        logErrors: true,
      }
      const expectedWhat = 'ENABLE_USER'
      const expectedDetails = '{"adminId":"some admin","userId":"some user"}'

      await assertAuditMessageIsPublishedCorrectly(
        auditService.enableUser.bind(auditService),
        auditMessage,
        expectedWhat,
        adminId,
        expectedDetails,
      )
    })

    it('logs out errors if logErrors is true when creating group', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.enableUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        logErrors: true,
      })
    })

    it('does not log out errors if logErrors is false when creating group', async () => {
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.enableUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        logErrors: false,
      })
    })
  })

  async function assertAuditMessageIsPublishedCorrectly(
    fn: AuditFunction,
    auditMessage: object,
    expectedWhat: string,
    expectedWho: string,
    expectedDetails: string,
  ) {
    jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
    await fn(auditMessage)

    const { MessageBody, QueueUrl } = (SQSClient.prototype.send as jest.Mock).mock.calls[0][0].input
    const { what, when, who, service, details } = JSON.parse(MessageBody)

    expect(QueueUrl).toEqual('http://localhost:4566/000000000000/mainQueue')
    expect(what).toEqual(expectedWhat)
    expect(when).toBeDefined()
    expect(who).toEqual(expectedWho)
    expect(service).toEqual('hmpps-manage-users')
    expect(details).toEqual(expectedDetails)
  }

  async function assertErrorsLoggedWhenLogErrorsIsTrue(fn: AuditFunction, auditMessage: object) {
    const err = new Error('SQS queue not found')
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(err as never)
    jest.spyOn(logger, 'error')
    await fn(auditMessage)
    expect(logger.error).toHaveBeenCalledWith('Problem sending message to SQS queue', err)
  }

  async function assertErrorsNotLoggedWhenLogErrorsIsFalse(fn: AuditFunction, auditMessage: object) {
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(new Error('SQS queue not found') as never)
    jest.spyOn(logger, 'error')
    await auditService.removeRoleFromUser(auditMessage)
    expect(logger.error).not.toHaveBeenCalled()
  }
})
