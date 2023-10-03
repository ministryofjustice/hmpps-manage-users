import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'

class AuditService {
  private sqsClient: SQSClient

  constructor(private readonly queueUrl = config.apis.audit.queueUrl) {
    this.sqsClient = new SQSClient({
      region: config.apis.audit.region,
    })
  }

  async addRoleToUser({
    adminId,
    userId,
    roles,
    logErrors,
  }: {
    adminId: string
    userId: string
    roles: Array<string>
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'ADD_USER_ROLE',
      who: adminId,
      userId,
      roles,
      logErrors,
    })
  }

  async sendAuditMessage({
    action,
    who,
    timestamp = new Date(),
    userId,
    roles,
    logErrors,
  }: {
    action: string
    who: string
    timestamp?: Date
    userId: string
    roles: Array<string>
    logErrors: boolean
  }) {
    try {
      const message = JSON.stringify({
        what: action,
        when: timestamp,
        who,
        service: config.apis.audit.serviceName,
        details: JSON.stringify({ userId, roles }),
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

module.exports = { AuditService }
