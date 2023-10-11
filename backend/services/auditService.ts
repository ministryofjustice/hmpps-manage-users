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
    subjectId,
    roles,
    logErrors,
  }: {
    adminId: string
    subjectId: string
    roles: Array<string>
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'ADD_USER_ROLES',
      who: adminId,
      subjectId,
      subjectType: 'USER_ID',
      details: JSON.stringify({ roles }),
      logErrors,
    })
  }

  async removeRoleFromUser({
    adminId,
    subjectId,
    role,
    logErrors,
  }: {
    adminId: string
    subjectId: string
    role: string
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'REMOVE_USER_ROLE',
      who: adminId,
      subjectId,
      subjectType: 'USER_ID',
      details: JSON.stringify({ role }),
      logErrors,
    })
  }

  async createGroup({
    adminId,
    subjectId,
    group,
    logErrors,
  }: {
    adminId: string
    subjectId: string
    group: object
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'CREATE_GROUP',
      who: adminId,
      subjectId,
      subjectType: 'USER_ID',
      details: JSON.stringify({ group }),
      logErrors,
    })
  }

  async enableUser({
    adminId,
    subjectId,
    logErrors,
  }: {
    adminId: string
    subjectId: string
    group: object
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'ENABLE_USER',
      who: adminId,
      subjectId,
      subjectType: 'USER_ID',
      details: null,
      logErrors,
    })
  }

  async disableUser({
    adminId,
    subjectId,
    logErrors,
  }: {
    adminId: string
    subjectId: string
    group: object
    logErrors: boolean
  }) {
    return this.sendAuditMessage({
      action: 'DISABLE_USER',
      who: adminId,
      subjectId,
      subjectType: 'USER_ID',
      details: null,
      logErrors,
    })
  }

  async sendAuditMessage({
    action,
    who,
    timestamp = new Date(),
    subjectId,
    subjectType,
    details,
    logErrors,
  }: {
    action: string
    who: string
    timestamp?: Date
    subjectId: string
    subjectType: string
    details: string
    logErrors: boolean
  }) {
    try {
      const message = JSON.stringify({
        what: action,
        when: timestamp,
        who,
        subjectId,
        subjectType,
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
