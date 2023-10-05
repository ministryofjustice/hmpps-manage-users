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

  async addRolesToUser({
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
      action: 'ADD_USER_ROLES',
      who: adminId,
      details: JSON.stringify({ adminId, userId, roles }),
      logErrors,
    })
  }

  async removeRoleFromUser({
    adminId,
    userId,
    role,
    logErrors,
  }: {
    adminId: string
    userId: string
    role: string
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'REMOVE_USER_ROLE',
      who: adminId,
      details: JSON.stringify({ adminId, userId, role }),
      logErrors,
    })
  }

  async createGroup({
    adminId,
    userId,
    group,
    logErrors,
  }: {
    adminId: string
    userId: string
    group: object
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'CREATE_GROUP',
      who: adminId,
      details: JSON.stringify({ adminId, userId, group }),
      logErrors,
    })
  }

  async sendAuditMessage({
    action,
    who,
    timestamp = new Date(),
    details,
    logErrors,
  }: {
    action: string
    who: string
    timestamp?: Date
    details: string
    logErrors: boolean
  }) {
    try {
      const message = JSON.stringify({
        what: action,
        when: timestamp,
        who,
        service: config.apis.audit.serviceName,
        details,
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
