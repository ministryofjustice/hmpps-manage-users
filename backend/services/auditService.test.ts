// import { SQSClient } from '@aws-sdk/client-sqs'
// import logger from '../../logger'
// import auditService from './auditService'
//
// describe('Audit service', () => {
//   beforeEach(() => {
//     jest.resetAllMocks()
//   })
//
//   it('sends a prisoner search audit message', async () => {
//     jest.spyOn(SQSClient.prototype, 'send').mockResolvedValue({} as never)
//     await auditService.addRoleToUser({
//       admin: 'some admin',
//       user: 'some user',
//       roles: ['NEW_ROLE'],
//       logErrors: true,
//     })
//
//     const { MessageBody, QueueUrl } = (SQSClient.prototype.send as jest.Mock).mock.calls[0][0].input
//     const { what, when, who, service, details } = JSON.parse(MessageBody)
//
//     expect(QueueUrl).toEqual('http://localhost:4566/000000000000/mainQueue')
//     expect(what).toEqual('ADD_USER_ROLE')
//     expect(when).toBeDefined()
//     expect(who).toEqual('some admin')
//     expect(service).toEqual('manage-users-ui')
//     expect(details).toEqual('{"admin":"some admin","user":"some user","roles":["NEW_ROLE"]}')
//   })
//
//   it('logs out errors if logErrors is true', async () => {
//     const err = new Error('SQS queue not found')
//     jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(err as never)
//     jest.spyOn(logger, 'error')
//     await auditService.addRoleToUser({
//       admin: 'some admin',
//       user: 'some user',
//       roles: ['NEW_ROLE'],
//       logErrors: true,
//     })
//     expect(logger.error).toHaveBeenCalledWith('Problem sending message to SQS queue', err)
//   })
//
//   it('does not log out errors if logErrors is false', async () => {
//     jest.spyOn(SQSClient.prototype, 'send').mockRejectedValue(new Error('SQS queue not found') as never)
//     jest.spyOn(logger, 'error')
//     await auditService.addRoleToUser({
//       admin: 'some admin',
//       user: 'some user',
//       roles: ['NEW_ROLE'],
//       logErrors: false,
//     })
//     expect(logger.error).not.toHaveBeenCalled()
//   })
// })
