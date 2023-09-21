import { SQSClient } from '@aws-sdk/client-sqs'
import { AuditService } from './auditService'
import logger from '../../logger'

describe('Audit service', () => {
  let auditService: AuditService

  beforeEach(() => {
    auditService = new AuditService()
    jest.resetAllMocks()
  })

  it('sends a prisoner search audit message', async () => {
    jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
    await auditService.addRoleToUser({
      admin: 'some admin',
      user: 'some user',
      roles: ['NEW_ROLE'],
      logErrors: true,
    })

    const { MessageBody, QueueUrl } = (SQSClient.prototype.send as jest.Mock).mock.calls[0][0].input
    const { operationId, what, when, who, service, details } = JSON.parse(MessageBody)

    expect(QueueUrl).toEqual('foobar')
    expect(operationId).toEqual('operationId')
    expect(what).toEqual('ADD_USER_ROLE')
    expect(when).toBeDefined()
    expect(who).toEqual('some admin')
    expect(service).toEqual('manage-users-ui')
    expect(details).toEqual('{"admin":"some admin","user":"some user","role":"NEW_ROLE"}')
  })

  it('logs out errors if logErrors is true', async () => {
    const err = new Error('SQS queue not found')
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(err as never)
    jest.spyOn(logger, 'error')
    await auditService.addRoleToUser({
      admin: 'some admin',
      user: 'some user',
      roles: ['NEW_ROLE'],
      logErrors: true,
    })
    expect(logger.error).toHaveBeenCalledWith('Problem sending message to SQS queue', err)
  })

  it('does not log out errors if logErrors is false', async () => {
    jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(new Error('SQS queue not found') as never)
    jest.spyOn(logger, 'error')
    await auditService.addRoleToUser({
      admin: 'some admin',
      user: 'some user',
      roles: ['NEW_ROLE'],
      logErrors: false,
    })
    expect(logger.error).not.toHaveBeenCalled()
  })
})
