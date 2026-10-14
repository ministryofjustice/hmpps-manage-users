import { Request, Router } from 'express'
import { CreateGroupRequest } from 'manageUsersApiClient'
import { Response } from 'superagent'
import { Services } from '../../services'
import {
  bodyFromFlash,
  flashBody,
  flashErrors,
  formErrorsFromFlash,
  validateFormOrRedirect,
} from '../../middleware/route/formMiddleware'
import paths from '../paths'
import { FormError } from '../../interfaces/formError'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { validateGroupCode, validateGroupName } from '../../presentation/validation/groupValidation'
import { HttpStatusCode, isErrorResponse } from '../../utils/utils'
import { AuditDetailsProvider, GroupRequest, StringFromRequestProvider } from './types'
import GroupsService from '../../services/groupsService'
import { EventType } from '../audit'

export const createGroupRouter = (services: Services): Router => {
  return templateCreateGroupRouter(
    services,
    'Create Group',
    'Group code',
    'Group name',
    _req => paths.groups.list.pattern,
    _req => paths.groups.create.pattern,
    (_req, body: CreateGroupRequest) => paths.groups.details({ group: body.groupCode }),
    (groupsService, token, _req, body) => groupsService.createGroup(token, body),
    (_req, body: CreateGroupRequest) => {
      return body
    },
  )
}

export const createChildGroupRouter = (services: Services): Router => {
  return templateCreateGroupRouter<GroupRequest>(
    services,
    'Create child group',
    'Child group code',
    'Child group name',
    req => paths.groups.details({ group: req.groupDetails.groupCode }),
    req => paths.groups.createChildGroup({ group: req.groupDetails.groupCode }),
    (req, _body: CreateGroupRequest) => paths.groups.details({ group: req.groupDetails.groupCode }),
    (groupsService, token, req, body) => groupsService.createChildGroup(token, req.groupDetails.groupCode, body),
    (req, body) => {
      const parentGroupCode = req.groupDetails.groupCode
      return { body, parentGroupCode }
    },
  )
}

type GroupCreator<GroupRequestType extends Request> = (
  groupsService: GroupsService,
  token: string,
  req: GroupRequestType,
  body: CreateGroupRequest,
) => Promise<Response>

const validate = (body: CreateGroupRequest): FormError[] => {
  const errors: FormError[] = []

  errors.push(...validateGroupName(body.groupName))
  errors.push(...validateGroupCode(body.groupCode))

  return errors
}

const templateCreateGroupRouter = <GroupRequestType extends Request>(
  services: Services,
  title: string,
  groupCodeText: string,
  groupNameText: string,
  groupUrlProvider: StringFromRequestProvider<GroupRequestType>,
  failureRedirectProvider: StringFromRequestProvider<GroupRequestType>,
  successRedirectProvider: StringFromRequestProvider<GroupRequestType>,
  groupCreator: GroupCreator<GroupRequestType>,
  auditDetailsProvider: AuditDetailsProvider<GroupRequestType, CreateGroupRequest>,
) => {
  const router = Router({ mergeParams: true })

  router.use(authRoleGuardMiddleware([AuthRole.MAINTAIN_OAUTH_USERS]))

  router.get('/', async (req, res) => {
    const body = bodyFromFlash<CreateGroupRequest>(req)
    const errors = formErrorsFromFlash(req)

    const groupUrl = groupUrlProvider(req as GroupRequestType)

    return res.render('pages/groups/create', {
      title,
      groupCodeText,
      groupNameText,
      ...body,
      errors,
      groupUrl,
    })
  })

  router.post(
    '/',
    validateFormOrRedirect(validate, req => failureRedirectProvider(req as GroupRequestType)),
    async (req, res) => {
      const { auditService, groupsService } = services
      const body = bodyFromFlash<CreateGroupRequest>(req)
      const groupRequest = req as GroupRequestType
      const { username, token } = res.locals.user
      const errors: FormError[] = []
      try {
        await groupCreator(groupsService, token, groupRequest, body)
      } catch (err) {
        if (isErrorResponse(err) && err.responseStatus === HttpStatusCode.CONFLICT && err.data) {
          errors.push({ href: '#groupCode', text: 'Group code already exists' })
        } else {
          throw err
        }
      }
      if (errors.length) {
        flashBody(req, body)
        flashErrors(req, errors)
        return res.redirect(failureRedirectProvider(groupRequest))
      }
      await auditService.logAuditEvent({
        what: EventType.CREATE_GROUP,
        who: username,
        subjectId: body.groupCode,
        subjectType: 'GROUP_CODE',
        details: { ...auditDetailsProvider(groupRequest, body) },
      })
      return res.redirect(successRedirectProvider(groupRequest, body))
    },
  )

  return router
}
