import { SQSClient } from '@aws-sdk/client-sqs'
import logger from '../../logger'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AuditService } = require('./auditService')

describe('Audit service', () => {
  const auditService = new AuditService()
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('sends a roles added to user audit message', async () => {
    const auditMessage = {
      admin: 'some admin',
      user: 'some user',
      roles: ['NEW_ROLE'],
      logErrors: true,
    }
    const expectedWhat = 'ADD_USER_ROLES'
    const expectedWho = 'some admin'
    const expectedDetails = '{"admin":"some admin","user":"some user","roles":["NEW_ROLE"]}'
    await assertAuditMessageIsPublishedCorrectly(
      auditService.addRolesToUser.bind(auditService),
      auditMessage,
      expectedWhat,
      expectedWho,
      expectedDetails,
    )
  })

  it('sends a role removed from user audit message', async () => {
    jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
    const auditMessage = {
      admin: 'some admin',
      user: 'some user',
      role: 'ROLE_TO_REMOVE',
      logErrors: true,
    }
    const expectedWhat = 'REMOVE_USER_ROLE'
    const expectedWho = 'some admin'
    const expectedDetails = '{"admin":"some admin","user":"some user","role":"ROLE_TO_REMOVE"}'

    await assertAuditMessageIsPublishedCorrectly(
      auditService.removeRoleFromUser.bind(auditService),
      auditMessage,
      expectedWhat,
      expectedWho,
      expectedDetails,
    )
  })

  it('logs out errors if logErrors is true when adding user roles', async () => {
    const err = new Error('SQS queue not found')
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(err as never)
    jest.spyOn(logger, 'error')
    await auditService.addRolesToUser({
      admin: 'some admin',
      user: 'some user',
      roles: ['NEW_ROLE'],
      logErrors: true,
    })
    expect(logger.error).toHaveBeenCalledWith('Problem sending message to SQS queue', err)
  })

  it('logs out errors if logErrors is true when removing user role', async () => {
    const err = new Error('SQS queue not found')
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(err as never)
    jest.spyOn(logger, 'error')
    await auditService.removeRoleFromUser({
      admin: 'some admin',
      user: 'some user',
      role: 'ROLE_TO_REMOVE',
      logErrors: true,
    })
    expect(logger.error).toHaveBeenCalledWith('Problem sending message to SQS queue', err)
  })

  it('does not log out errors if logErrors is false for add roles to user', async () => {
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(new Error('SQS queue not found') as never)
    jest.spyOn(logger, 'error')
    await auditService.addRolesToUser({
      admin: 'some admin',
      user: 'some user',
      roles: ['NEW_ROLE'],
      logErrors: false,
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('does not log out errors if logErrors is false for remove role from user', async () => {
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(new Error('SQS queue not found') as never)
    jest.spyOn(logger, 'error')
    await auditService.removeRoleFromUser({
      admin: 'some admin',
      user: 'some user',
      role: 'ROLE_TO_REMOVE',
      logErrors: false,
    })
    expect(logger.error).not.toHaveBeenCalled()
  })

  type AuditFunction = (message: object) => Promise<void>

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
})
