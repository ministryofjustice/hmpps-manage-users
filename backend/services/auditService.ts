import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs'
import logger from '../../logger'
import config from '../config'

const sqsClient = new SQSClient({
  region: config.apis.audit.region,
})

const { queueUrl } = config.apis.audit

async function addRoleToUser({
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
  return sendAuditMessage({
    action: 'ADD_USER_ROLE',
    who: admin,
    admin,
    user,
    roles,
    logErrors,
  })
}

async function sendAuditMessage({
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

    const messageResponse = await sqsClient.send(
      new SendMessageCommand({
        MessageBody: message,
        QueueUrl: queueUrl,
      }),
    )

    logger.info(`SQS message sent (${messageResponse.MessageId})`)
  } catch (error) {
    if (logErrors) {
      logger.error('Problem sending message to SQS queue', error)
    }
  }
}

export default { addRoleToUser }
