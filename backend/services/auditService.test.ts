import { SQSClient } from '@aws-sdk/client-sqs'
import logger from '../../logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AuditService } = require('./auditService')

const adminId = 'some admin'
const userId = 'some user'
const userIdSubjectType = 'USER_ID'
type AuditFunction = (message: object) => Promise<void>

describe('Audit service', () => {
  const auditService = new AuditService()
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('add role', () => {
    const functionArgs = { adminId, subjectId: userId, roles: ['NEW_ROLE'], logErrors: true }

    it('sends audit message', async () => {
      const expectedWhat = 'ADD_USER_ROLES'
      const expectedWho = 'some admin'
      const expectedDetails = '{"roles":["NEW_ROLE"]}'
      await assertAuditMessageIsPublishedCorrectly(
        auditService.addRolesToUser.bind(auditService),
        functionArgs,
        expectedWhat,
        expectedWho,
        userId,
        userIdSubjectType,
        expectedDetails,
      )
    })

    it('logs out errors if logErrors is true', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.addRolesToUser.bind(auditService), functionArgs)
    })

    it('does not log out errors if logErrors is false', async () => {
      functionArgs.logErrors = false
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.addRolesToUser.bind(auditService), functionArgs)
    })
  })

  describe('remove role', () => {
    const functionArgs = {
      adminId,
      subjectId: userId,
      role: 'ROLE_TO_REMOVE',
      logErrors: true,
    }

    it('sends audit message', async () => {
      jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
      const expectedWhat = 'REMOVE_USER_ROLE'
      const expectedWho = 'some admin'
      const expectedDetails = '{"role":"ROLE_TO_REMOVE"}'

      await assertAuditMessageIsPublishedCorrectly(
        auditService.removeRoleFromUser.bind(auditService),
        functionArgs,
        expectedWhat,
        expectedWho,
        userId,
        userIdSubjectType,
        expectedDetails,
      )
    })

    it('logs out errors if logErrors is true', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.removeRoleFromUser.bind(auditService), functionArgs)
    })

    it('does not log out errors if logErrors is false', async () => {
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.removeRoleFromUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        role: 'ROLE_TO_REMOVE',
        logErrors: false,
      })
    })
  })

  describe('create group', () => {
    const functionArgs = {
      adminId,
      subjectId: userId,
      group: { groupCode: 'TEST', groupName: 'test group' },
      logErrors: true,
    }

    it('sends audit message', async () => {
      jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
      const expectedWhat = 'CREATE_GROUP'
      const expectedDetails = '{"group":{"groupCode":"TEST","groupName":"test group"}}'

      await assertAuditMessageIsPublishedCorrectly(
        auditService.createGroup.bind(auditService),
        functionArgs,
        expectedWhat,
        adminId,
        userId,
        userIdSubjectType,
        expectedDetails,
      )
    })

    it('logs out errors if logErrors is true when creating group', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.createGroup.bind(auditService), functionArgs)
    })

    it('does not log out errors if logErrors is false when creating group', async () => {
      functionArgs.logErrors = false
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.createGroup.bind(auditService), functionArgs)
    })
  })

  describe('enable user', () => {
    const functionArgs = {
      adminId: 'some admin',
      subjectId: userId,
      logErrors: true,
    }

    it('sends audit message', async () => {
      jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
      const expectedWhat = 'ENABLE_USER'

      await assertAuditMessageIsPublishedCorrectly(
        auditService.enableUser.bind(auditService),
        functionArgs,
        expectedWhat,
        adminId,
        userId,
        userIdSubjectType,
        null,
      )
    })

    it('logs out errors if logErrors is true', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.enableUser.bind(auditService), functionArgs)
    })

    it('does not log out errors if logErrors is false', async () => {
      functionArgs.logErrors = false
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.enableUser.bind(auditService), functionArgs)
    })
  })

  describe('disable user', () => {
    const functionArgs = {
      adminId: 'some admin',
      subjectId: userId,
      logErrors: true,
    }
    it('sends audit message', async () => {
      jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
      const expectedWhat = 'DISABLE_USER'

      await assertAuditMessageIsPublishedCorrectly(
        auditService.disableUser.bind(auditService),
        functionArgs,
        expectedWhat,
        adminId,
        userId,
        userIdSubjectType,
        null,
      )
    })

    it('logs out errors if logErrors is true', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.disableUser.bind(auditService), functionArgs)
    })

    it('does not log out errors if logErrors is false', async () => {
      functionArgs.logErrors = false
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.disableUser.bind(auditService), functionArgs)
    })
  })

  describe('enable user', () => {
    it('sends audit message', async () => {
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

    it('logs out errors if logErrors is true', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.enableUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        logErrors: true,
      })
    })

    it('does not log out errors if logErrors is false', async () => {
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.enableUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        logErrors: false,
      })
    })
  })

  describe('disable user', () => {
    it('sends audit message', async () => {
      jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
      const auditMessage = {
        adminId: 'some admin',
        userId: 'some user',
        logErrors: true,
      }
      const expectedWhat = 'DISABLE_USER'
      const expectedDetails = '{"adminId":"some admin","userId":"some user"}'

      await assertAuditMessageIsPublishedCorrectly(
        auditService.disableUser.bind(auditService),
        auditMessage,
        expectedWhat,
        adminId,
        expectedDetails,
      )
    })

    it('logs out errors if logErrors is true', async () => {
      await assertErrorsLoggedWhenLogErrorsIsTrue(auditService.disableUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        logErrors: true,
      })
    })

    it('does not log out errors if logErrors is false', async () => {
      await assertErrorsNotLoggedWhenLogErrorsIsFalse(auditService.disableUser.bind(auditService), {
        adminId: 'some admin',
        userId: 'some user',
        logErrors: false,
      })
    })
  })

  async function assertAuditMessageIsPublishedCorrectly(
    auditFunction: AuditFunction,
    functionArgs: object,
    expectedWhat: string,
    expectedWho: string,
    expectedSubjectId: string,
    expectedSubjectType: string,
    expectedDetails: string,
  ) {
    jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
    await auditFunction(functionArgs)

    const { MessageBody, QueueUrl } = (SQSClient.prototype.send as jest.Mock).mock.calls[0][0].input
    const { what, when, who, service, subjectId, subjectType, details } = JSON.parse(MessageBody)

    expect(QueueUrl).toEqual('http://localhost:4566/000000000000/mainQueue')
    expect(what).toEqual(expectedWhat)
    expect(when).toBeDefined()
    expect(who).toEqual(expectedWho)
    expect(subjectId).toEqual(expectedSubjectId)
    expect(subjectType).toEqual(expectedSubjectType)
    expect(service).toEqual('hmpps-manage-users')
    expect(details).toEqual(expectedDetails)
  }

  async function assertErrorsLoggedWhenLogErrorsIsTrue(fn: AuditFunction, functionArgs: object) {
    const err = new Error('SQS queue not found')
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(err as never)
    jest.spyOn(logger, 'error')
    await fn(functionArgs)
    expect(logger.error).toHaveBeenCalledWith('Problem sending message to SQS queue', err)
  }

  async function assertErrorsNotLoggedWhenLogErrorsIsFalse(fn: AuditFunction, functionArgs: object) {
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(new Error('SQS queue not found') as never)
    jest.spyOn(logger, 'error')
    await auditService.removeRoleFromUser(functionArgs)
    expect(logger.error).not.toHaveBeenCalled()
  }
})
