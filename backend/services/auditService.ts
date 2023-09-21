import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'

export class AuditService {
  private sqsClient: SQSClient

  constructor(private readonly queueUrl = config.apis.audit.queueUrl) {
    this.sqsClient = new SQSClient({
      region: config.apis.audit.region,
      credentials: {
        accessKeyId: config.apis.audit.accessKeyId,
        secretAccessKey: config.apis.audit.secretAccessKey,
      },
    })
  }

  async addRoleToUser({
    admin,
    user,
    role,
    logErrors,
  }: {
    admin: string
    user: string
    role: string
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'ADD_USER_ROLE',
      who: admin,
      admin,
      user,
      role,
      logErrors,
    })
  }

  async sendAuditMessage({
    action,
    who,
    timestamp = new Date(),
    admin,
    user,
    role,
    logErrors,
  }: {
    action: string
    who: string
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
        service: config.apis.audit.serviceName,
        details: JSON.stringify({ admin, user, role }),
      })

      console.log('before send sqs')
      console.log(this.queueUrl)
      console.log(config.apis.audit.accessKeyId)
      console.log(config.apis.audit.secretAccessKey)
      const messageResponse = await this.sqsClient.send(
        new SendMessageCommand({
          MessageBody: message,
          QueueUrl: this.queueUrl,
        }),
      )

      console.log('after send sqs')
      console.log(messageResponse)
      logger.info(`SQS message sent (${messageResponse.MessageId})`)
    } catch (error) {
      if (logErrors) {
        logger.error('Problem sending message to SQS queue', error)
      }
    }
  }
}
