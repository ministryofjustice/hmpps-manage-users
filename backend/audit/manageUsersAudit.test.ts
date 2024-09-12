import { auditService } from '@ministryofjustice/hmpps-audit-client'
import { audit, auditWithSubject } from './manageUsersAudit'
import { ManageUsersEvent } from './manageUsersEvent'
import { ManageUsersSubjectType } from './manageUsersSubjectType'
import config from '../config'

jest.mock('@ministryofjustice/hmpps-audit-client', () => ({
  auditService: {
    sendAuditMessage: jest.fn(),
  },
}))

jest.mock('uuid', () => ({
  v4: () => 'correlationId',
}))

describe('audit function', () => {
  const username = 'testUser'
  const manageUsersEvent = ManageUsersEvent.VIEW_USER_ATTEMPT
  const { productId } = config

  it('should call sendAuditMessage with correct parameters when minimal audit is called', async () => {
    const auditFunction = audit(username)
    await auditFunction(manageUsersEvent)

    expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
      action: manageUsersEvent,
      who: username,
      subjectId: null,
      subjectType: null,
      correlationId: 'correlationId',
      service: productId,
      details: null,
    })
  })

  it('should call sendAuditMessage with details', async () => {
    const details = { test: 'details' }

    const auditFunction = audit(username, details)
    await auditFunction(manageUsersEvent)

    expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
      action: manageUsersEvent,
      who: username,
      subjectId: null,
      subjectType: null,
      correlationId: 'correlationId',
      service: productId,
      details: '{"test":"details"}',
    })
  })
})

describe('auditWithSubject function', () => {
  const username = 'testUser'
  const manageUsersEvent = ManageUsersEvent.VIEW_USER_ATTEMPT
  const { productId } = config
  const subjectId = 'testSubjectId'
  const subjectType = ManageUsersSubjectType.USER_ID

  it('should call sendAuditMessage with correct parameters when minimal audit is called', async () => {
    const auditFunction = auditWithSubject(username, subjectId, subjectType)
    await auditFunction(manageUsersEvent)

    expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
      action: manageUsersEvent,
      who: username,
      subjectId,
      subjectType: 'USER_ID',
      correlationId: 'correlationId',
      service: productId,
      details: null,
    })
  })

  it('should call sendAuditMessage with details', async () => {
    const details = { test: 'details' }

    const auditFunction = auditWithSubject(username, subjectId, subjectType, details)
    await auditFunction(manageUsersEvent)

    expect(auditService.sendAuditMessage).toHaveBeenCalledWith({
      action: manageUsersEvent,
      who: username,
      subjectId,
      subjectType: 'USER_ID',
      correlationId: 'correlationId',
      service: productId,
      details: '{"test":"details"}',
    })
  })
})
