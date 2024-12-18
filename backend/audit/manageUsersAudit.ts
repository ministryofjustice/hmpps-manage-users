import { v4 as uuidv4 } from 'uuid'
import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { ManageUsersEvent } from './manageUsersEvent'
import config from '../config'
import logger from '../../logger'
import { ManageUsersSubjectType } from './manageUsersSubjectType'

const sendAuditMessage = async (
  manageUsersEvent: ManageUsersEvent,
  username: string,
  subjectId: string,
  subjectType: ManageUsersSubjectType,
  details: Record<string, unknown>,
  correlationId: string,
) => {
  if (!config.apis.audit.enabled) {
    logger.info(`${manageUsersEvent} - ${username} - ${subjectId} - ${subjectType} - ${JSON.stringify(details)}`)
  } else {
    const auditMessage = {
      action: manageUsersEvent,
      who: username,
      subjectId,
      subjectType,
      correlationId,
      service: config.apis.audit.serviceName,
      details: details ? JSON.stringify(details) : null,
    }
    await auditService.sendAuditMessage(auditMessage)
  }
}

export const audit = (username: string, details?: Record<string, unknown>): ManageUsersAuditFunction => {
  const correlationId = uuidv4()
  return async (manageUsersEvent: ManageUsersEvent) => {
    await sendAuditMessage(manageUsersEvent, username, null, null, details, correlationId)
  }
}

export const auditWithSubject = (
  username: string,
  subjectId: string,
  subjectType: ManageUsersSubjectType,
  details?: Record<string, unknown>,
): ManageUsersAuditFunction => {
  const correlationId = uuidv4()
  return async (manageUsersEvent: ManageUsersEvent) => {
    await sendAuditMessage(manageUsersEvent, username, subjectId, subjectType, details, correlationId)
  }
}

export type ManageUsersAuditFunction = (manageUsersEvent: ManageUsersEvent) => Promise<void>
