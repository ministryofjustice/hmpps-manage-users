import { Request, Response, Router } from 'express'
import multer from 'multer'
import { UserRole } from 'manageUsersApiClient'
import { Services } from '../../services'
import paths from '../paths'
import config from '../../config'
import logger from '../../../logger'
import AuthRole from '../../interfaces/authRole'
import authRoleGuardMiddleware from '../../middleware/route/authRoleGuardMiddleware'
import { csrfProtection } from '../../middleware/setUpCsrf'
import { FormError } from '../../interfaces/formError'
import {
  bodyFromFlash,
  flashBody,
  flashErrors,
  formErrorsFromFlash,
  validateFormOrRedirect,
} from '../../middleware/route/formMiddleware'
import { EventType } from '../audit'
import BulkUserRolesService, { CsvValidationError } from '../../services/bulkUserRolesService'
import { BulkUserRolesRequestSession, BulkUserRolesSummary } from './types'
import { validateJiraReference, validateSelectedRoles } from '../../presentation/validation/bulkUserRolesValidation'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
})

interface RoleOption {
  text: string
  value: string
}

const getOrCreateRequestSession = (req: {
  session: { bulkUserRolesRequest?: BulkUserRolesRequestSession }
}): BulkUserRolesRequestSession => {
  if (req.session.bulkUserRolesRequest === undefined) {
    req.session.bulkUserRolesRequest = {}
  }
  return req.session.bulkUserRolesRequest
}

const validateAllFieldsPresent = (details: BulkUserRolesRequestSession | undefined): FormError[] => {
  const errors: FormError[] = []

  if (!details?.jiraReference) {
    errors.push({ text: 'Jira reference is required', href: '#change-jira-ref' })
  }
  if (!details?.totalNumberOfUsers) {
    errors.push({ text: 'Users ids required', href: '#change-users-ref' })
  }
  if (!details?.roles || details.roles.length === 0) {
    errors.push({ text: 'Roles is required', href: '#change-roles-ref' })
  }
  if (!details?.usersFile?.data || details.usersFile.data.length === 0) {
    errors.push({ text: 'Upload file is required', href: '#change-users-ref' })
  }

  return errors
}

interface CompleteBulkUserRolesRequest {
  jiraReference: string
  roles: string[]
  totalNumberOfUsers: number
  usersFile: { filename: string; data: string }
}

const hasAllInputs = (details: BulkUserRolesRequestSession | undefined): details is CompleteBulkUserRolesRequest =>
  validateAllFieldsPresent(details).length === 0

const getSummary = (details: BulkUserRolesRequestSession | undefined, requestedBy: string): BulkUserRolesSummary => {
  const totalUsers = details?.totalNumberOfUsers || 0
  const totalRoles = details?.roles?.length || 0

  return {
    requestedBy,
    jiraReference: details?.jiraReference || 'N/A',
    roles: details?.roles || [],
    uploadFile: details?.usersFile?.filename || 'N/A',
    totalNumberOfUsers: totalUsers,
    totalAssignments: totalUsers * totalRoles,
  }
}

const getSelectedRolesFromBody = (body: { selectedRoles?: string | string[] }): string[] => {
  const { selectedRoles } = body || {}
  if (selectedRoles === undefined) return []
  return Array.isArray(selectedRoles) ? selectedRoles : [selectedRoles]
}

const getRoleOptions = async (bulkUserRolesService: BulkUserRolesService, token: string): Promise<RoleOption[]> => {
  const roles: UserRole[] = await bulkUserRolesService.getSelectableRoles(token)
  return roles.map(r => ({ text: r.roleName, value: r.roleCode }))
}

export default (services: Services): Router => {
  const router = Router()
  const { auditService, bulkUserRolesService } = services

  router.use(authRoleGuardMiddleware([AuthRole.MANAGE_USER_BULK_JOBS]))

  router.get('/', (req, res) => {
    const details = getOrCreateRequestSession(req)
    const errors = formErrorsFromFlash(req)
    const body = bodyFromFlash<{ jiraReference?: string }>(req)

    return res.render('pages/bulkUserRoles/createRequest', {
      details: { ...details, ...body },
      errors,
      jiraReferenceUrl: paths.bulkUserRoles.create.jiraReference.pattern,
    })
  })

  router.post(
    '/jira-reference',
    validateFormOrRedirect(validateJiraReference, () => paths.bulkUserRoles.create.root.pattern),
    (req, res) => {
      const details = getOrCreateRequestSession(req)
      details.jiraReference = req.body.jiraReference

      return res.redirect(
        hasAllInputs(details)
          ? paths.bulkUserRoles.create.summary.pattern
          : paths.bulkUserRoles.create.selectRoles.pattern,
      )
    },
  )

  router.get('/select-roles', async (req, res) => {
    const details = getOrCreateRequestSession(req)
    const errors = formErrorsFromFlash(req)
    const body = bodyFromFlash<{ selectedRoles?: string[] }>(req)
    const rolesList = await getRoleOptions(bulkUserRolesService, res.locals.user.token)
    const selectedRoles = body.selectedRoles ?? details.roles ?? []

    return res.render('pages/bulkUserRoles/selectRoles', {
      rolesList,
      selectedRoles,
      errors,
      maxSelections: config.app.maxBulkRolesSelection,
      selectRolesUrl: paths.bulkUserRoles.create.selectRoles.pattern,
      backUrl: paths.bulkUserRoles.create.root.pattern,
    })
  })

  router.post('/select-roles', async (req, res) => {
    const details = getOrCreateRequestSession(req)
    const rolesList = await getRoleOptions(bulkUserRolesService, res.locals.user.token)
    const selectedRoles = getSelectedRolesFromBody(req.body)
    const errors = validateSelectedRoles(selectedRoles, rolesList, config.app.maxBulkRolesSelection)

    if (errors.length > 0) {
      const validSelections = selectedRoles.filter(s => rolesList.some(r => s === r.value))
      flashBody(req, { selectedRoles: validSelections })
      flashErrors(req, errors)
      return res.redirect(paths.bulkUserRoles.create.selectRoles.pattern)
    }

    details.roles = selectedRoles

    return res.redirect(
      hasAllInputs(details)
        ? paths.bulkUserRoles.create.summary.pattern
        : paths.bulkUserRoles.create.uploadUsers.pattern,
    )
  })

  router.get('/upload-users', (req, res) => {
    getOrCreateRequestSession(req)
    const errors = formErrorsFromFlash(req)
    return res.render('pages/bulkUserRoles/uploadUsersCsv', {
      errors,
      uploadUsersUrl: paths.bulkUserRoles.create.uploadUsers.pattern,
      backUrl: paths.bulkUserRoles.create.selectRoles.pattern,
    })
  })

  const redirectToFileUpload = (req: Request, text: string, res: Response) => {
    flashErrors(req, [{ text, href: '#upload-users-file' }])
    return res.redirect(paths.bulkUserRoles.create.uploadUsers.pattern)
  }

  router.post('/upload-users', upload.single('file'), csrfProtection, async (req, res) => {
    const details = getOrCreateRequestSession(req)
    try {
      if (!req.file) {
        return redirectToFileUpload(req, 'file is required but was null', res)
      }
      const uploadedFile = req.file
      details.totalNumberOfUsers = await bulkUserRolesService.countAndValidateUsersCsv(uploadedFile)
      details.usersFile = { filename: uploadedFile.originalname, data: uploadedFile.buffer.toString('base64') }
      return res.redirect(paths.bulkUserRoles.create.summary.pattern)
    } catch (err) {
      if (err instanceof CsvValidationError) {
        return redirectToFileUpload(req, err.message, res)
      }
      throw err
    }
  })

  router.get('/summary', (req, res) => {
    const details = getOrCreateRequestSession(req)
    const errors = validateAllFieldsPresent(details)
    const submitRequestError = formErrorsFromFlash(req)
    const summary = getSummary(details, res.locals.user.username)

    return res.render('pages/bulkUserRoles/summary', {
      summary,
      errors: errors.length > 0 ? errors : undefined,
      submitRequestError: submitRequestError.length > 0 ? submitRequestError : undefined,
      submitUrl: paths.bulkUserRoles.create.submit.pattern,
      changeJiraReferenceUrl: paths.bulkUserRoles.create.root.pattern,
      changeRolesUrl: paths.bulkUserRoles.create.selectRoles.pattern,
      changeUploadFileUrl: paths.bulkUserRoles.create.uploadUsers.pattern,
    })
  })

  router.post('/submit', async (req, res) => {
    const details = getOrCreateRequestSession(req)
    const { username, token } = res.locals.user

    if (!hasAllInputs(details)) {
      return res.redirect(paths.bulkUserRoles.create.summary.pattern)
    }

    const { jiraReference, roles, usersFile } = details

    await auditService.logAuditEvent({
      what: EventType.SUBMIT_BULK_USER_ROLE_ADDITIONS_ATTEMPT,
      who: username,
      subjectId: jiraReference,
      subjectType: 'JIRA_REFERENCE',
      details: { roles, usersCsv: usersFile.filename },
    })

    try {
      await bulkUserRolesService.submitBulkUserRoleAdditionsJob(token, jiraReference, roles, {
        buffer: Buffer.from(usersFile.data, 'base64'),
        originalname: usersFile.filename,
      })
    } catch (err) {
      logger.error('submit bulk user roles request unsuccessful', err)
      await auditService.logAuditEvent({
        what: EventType.SUBMIT_BULK_USER_ROLE_ADDITIONS_FAILURE,
        who: username,
        subjectId: jiraReference,
        subjectType: 'JIRA_REFERENCE',
      })
      flashErrors(req, [{ text: 'Internal Server Error' }])
      return res.redirect(paths.bulkUserRoles.create.summary.pattern)
    }

    delete req.session.bulkUserRolesRequest
    return res.render('pages/bulkUserRoles/confirmation', {
      jiraReference,
      viewRequestsUrl: paths.bulkUserRoles.view.list.pattern,
    })
  })

  return router
}
