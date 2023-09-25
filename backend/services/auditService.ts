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
    admin,
    user,
    roles,
    logErrors,
  }: {
    admin: string
    user: string
    roles: Array<string>
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'ADD_USER_ROLE',
      who: admin,
      admin,
      user,
      roles,
      logErrors,
    })
  }

  async sendAuditMessage({
    action,
    who,
    timestamp = new Date(),
    admin,
    user,
    roles,
    logErrors,
  }: {
    action: string
    who: string
    timestamp?: Date
    admin: string
    user: string
    roles: Array<string>
    logErrors: boolean
  }) {
    try {
      const message = JSON.stringify({
        what: action,
        when: timestamp,
        who,
        service: config.apis.audit.serviceName,
        details: JSON.stringify({ admin, user, roles }),
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

export default AuditService
