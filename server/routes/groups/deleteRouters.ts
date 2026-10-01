import { RequestHandler, Request, Router } from 'express'
import { ChildGroup, Group } from 'manageUsersApiClient'
import { Response } from 'superagent'
import { Services } from '../../services'
import {
  bodyFromFlash,
  flashErrors,
  formErrorsFromFlash,
  validateFormOrRedirect,
} from '../../middleware/route/formMiddleware'
import paths from '../paths'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { FormError } from '../../interfaces/formError'
import { AuditDetailsProvider, ChildGroupRequest, GroupRequest, StringFromRequestProvider } from './types'
import GroupsService from '../../services/groupsService'
import { EventType } from '../audit'

interface Form {
  confirmedGroup: string
}

type GroupDetailsProvider<GroupRequestType extends Request, GroupDetailsType extends { groupCode: string }> = (
  req: GroupRequestType,
) => GroupDetailsType

type GroupDeleter<GroupRequestType extends Request> = (
  groupsService: GroupsService,
  token: string,
  req: GroupRequestType,
) => Promise<Response>

const validate = <GroupRequestType extends Request>(
  body: Form,
  req: GroupRequestType,
  groupCodeProvider: StringFromRequestProvider<GroupRequestType>,
): FormError[] => {
  const errors: FormError[] = []
  const expectedGroupCode = groupCodeProvider(req)

  if (body.confirmedGroup !== expectedGroupCode) {
    errors.push({ href: '#confirmedGroup', text: `Enter "${expectedGroupCode}" to confirm deletion of group` })
  }

  return errors
}

const showDeleteConfirmation = <GroupRequestType extends Request, GroupDetailsType extends { groupCode: string }>(
  groupText: string,
  groupDetailsProvider: GroupDetailsProvider<GroupRequestType, GroupDetailsType>,
  groupUrlProvider: StringFromRequestProvider<GroupRequestType>,
  breadcrumbsGroupNameProvider: StringFromRequestProvider<GroupRequestType>,
): RequestHandler => {
  return async (req, res) => {
    const groupRequest = req as GroupRequestType
    const groupDetails = groupDetailsProvider(groupRequest)
    const body = bodyFromFlash<Form>(req)
    const errors = formErrorsFromFlash(req)
    const maintainUrl = paths.groups.list.pattern
    const groupUrl = groupUrlProvider(groupRequest)
    const breadcrumbsGroupName = breadcrumbsGroupNameProvider(groupRequest)

    return res.render('pages/groups/delete', {
      ...body,
      groupText,
      breadcrumbsGroupName,
      groupDetails,
      groupUrl,
      maintainUrl,
      errors,
    })
  }
}

const postDeleteConfirmation = <GroupRequestType extends Request>(
  services: Services,
  groupDeleter: GroupDeleter<GroupRequestType>,
  groupCodeProvider: StringFromRequestProvider<GroupRequestType>,
  successRedirectProvider: StringFromRequestProvider<GroupRequestType>,
  auditDetailsProvider: AuditDetailsProvider<GroupRequestType> = _req => ({}),
): RequestHandler => {
  return async (req, res) => {
    const groupRequest = req as GroupRequestType
    const { auditService, groupsService } = services
    const { username, token } = res.locals.user
    const body = bodyFromFlash<Form>(req)
    const groupCode = groupCodeProvider(groupRequest)

    await groupDeleter(groupsService, token, groupRequest)
    await auditService.logAuditEvent({
      what: EventType.DELETE_GROUP,
      who: username,
      subjectId: groupCode,
      subjectType: 'GROUP_CODE',
      details: { ...auditDetailsProvider(groupRequest, body) },
    })
    return res.redirect(successRedirectProvider(groupRequest))
  }
}

export const deleteRouter = (services: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS]))

  router.get(
    '/',
    async (req, res, next) => {
      const groupRequest = req as GroupRequest
      if (groupRequest.groupDetails.children?.length > 0) {
        flashErrors(groupRequest, [
          { href: '#groupCode', text: 'Group has child groups please delete before trying to delete parent group' },
        ])
        return res.redirect(paths.groups.details({ group: groupRequest.groupDetails.groupCode }))
      }
      return next()
    },
    showDeleteConfirmation<GroupRequest, Group>(
      'group',
      req => req.groupDetails,
      req => paths.groups.details({ group: req.groupDetails.groupCode }),
      req => req.groupDetails.groupName,
    ),
  )

  router.post(
    '/',
    validateFormOrRedirect(
      (form: Form, req) => validate(form, req, r => (r as GroupRequest).groupDetails.groupCode),
      req => paths.groups.delete({ group: (req as GroupRequest).groupDetails.groupCode }),
    ),
    postDeleteConfirmation<GroupRequest>(
      services,
      (groupsService, token, req) => groupsService.deleteGroup(token, req.groupDetails.groupCode),
      req => req.groupDetails.groupCode,
      _req => paths.groups.list.pattern,
    ),
  )

  return router
}

export const deleteChildGroupRouter = (services: Services): Router => {
  const router = Router()

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS]))

  router.get(
    '/',
    showDeleteConfirmation<ChildGroupRequest, ChildGroup>(
      'child group',
      req => req.childGroupDetails,
      req => paths.groups.details({ group: req.groupDetails.groupCode }),
      req => req.groupDetails.groupName,
    ),
  )

  router.post(
    '/',
    validateFormOrRedirect(
      (form: Form, req) => validate(form, req, r => (r as ChildGroupRequest).childGroupDetails.groupCode),
      req => {
        const childGroupRequest = req as ChildGroupRequest
        return paths.groups.deleteChildGroup({
          group: childGroupRequest.groupDetails.groupCode,
          childGroup: childGroupRequest.childGroupDetails.groupCode,
        })
      },
    ),
    postDeleteConfirmation<ChildGroupRequest>(
      services,
      (groupsService, token, req) => groupsService.deleteChildGroup(token, req.childGroupDetails.groupCode),
      req => req.childGroupDetails.groupCode,
      req => paths.groups.details({ group: req.groupDetails.groupCode }),
      (req, _body) => {
        return { parentGroupCode: req.groupDetails.groupCode }
      },
    ),
  )

  return router
}
