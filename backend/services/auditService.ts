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
      subjectType: USER_ID_SUBJECT_TYPE,
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
      subjectType: USER_ID_SUBJECT_TYPE,
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
      subjectType: USER_ID_SUBJECT_TYPE,
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
      subjectType: USER_ID_SUBJECT_TYPE,
      details: null,
      logErrors,
    })
  }

  async sendAuditMessage({
    action,
    who,
    subjectId,
    subjectType,
    details,
    logErrors = true,
  }: {
    action: string
    who: string
    subjectId?: string
    subjectType?: string
    details?: string
    logErrors?: boolean
  }) {
    try {
      const message = JSON.stringify({
        what: action,
        when: new Date(),
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

export const auditService = new AuditService()
export const USER_ID_SUBJECT_TYPE = 'USER_ID'
