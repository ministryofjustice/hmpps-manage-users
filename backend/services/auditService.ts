import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'

export class AuditService {
  private sqsClient: SQSClient

  constructor(private readonly queueUrl = config.apis.audit.queueUrl) {
    this.sqsClient = new SQSClient({})
  }

  async addRoleToUser({
    subjectId,
    subjectType,
    admin,
    user,
    role,
    logErrors,
  }: {
    subjectId: string
    subjectType: string
    admin: string
    user: string
    role: string
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'ADD_USER_ROLE',
      who: admin,
      subjectId,
      subjectType,
      admin,
      user,
      role,
      logErrors,
    })
  }

  async sendAuditMessage({
    action,
    who,
    subjectId,
    subjectType,
    timestamp = new Date(),
    admin,
    user,
    role,
    logErrors,
  }: {
    action: string
    who: string
    subjectId: string
    subjectType: string
    timestamp?: Date
    admin: string
    user: string
    role: string
    logErrors: boolean
  }) {
    try {
      const message = JSON.stringify({
        operationId: 'operationId', // TODO where does this come from?
        what: action,
        when: timestamp,
        who,
        subjectId,
        subjectType,
        service: config.apis.audit.serviceName,
        details: JSON.stringify({ admin, user, role }),
      })

      const messageResponse = await this.sqsClient.send(
        new SendMessageCommand({
          MessageBody: message,
          QueueUrl: this.queueUrl,
        }),
      )

      logger.info(`SQS message sent (${messageResponse.MessageId})`)
    } catch (error) {
      if (logErrors) {
        logger.error('Problem sending message to SQS queue', error)
      }
    }
  }
}
