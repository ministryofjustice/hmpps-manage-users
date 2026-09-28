/* eslint-disable no-param-reassign */
import path from 'path'
import moment from 'moment'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import { PrisonCaseload, Role, UserGroup, UserRole } from 'manageUsersApiClient'
import { initialiseName } from './utils'
import config from '../config'
import logger from '../../logger'
import { FormError } from '../interfaces/formError'
import { SelectItem } from '../interfaces/selectItem'
import {
  caseloadText,
  showCaseloadDropdown,
  userTypeDisplay,
  userTypeExistingUsernameHint,
  userTypeExistingUsernameLabel,
  UserTypeKey,
  userTypeShorthand,
} from '../presentation/userType'
import { caseloadDropdownValues } from '../presentation/caseloads'
import paths from '../routes/paths'
import {
  roleDropdownValues,
  Filter as RoleFilter,
  filterCategories as roleFilterCategories,
} from '../presentation/roles'
import { Filter as DpsUserFilter, filterCategories as dpsUserFilterCategories } from '../presentation/searchDpsUser'
import {
  Filter as ExternalUserFilter,
  filterCategories as externalUserFilterCategories,
} from '../presentation/searchExternalUser'
import {
  Filter as UserAllowListFilter,
  filterCategories as userAllowListFilterCategories,
  UserAllowlistUserType,
  userTypeDisplay as userAllowlistUserTypeDisplay,
} from '../presentation/userAllowList'
import { isRestrictedRoleCode, RestrictedRoles } from '../presentation/restrictedRoles'
import groupValues from '../presentation/groups'
import manageUserAllowListHelper from './manageUserAllowListHelper'
import { statusDisplay, StatusKey } from '../presentation/status'

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'HMPPS Manage Users'
  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e, 'Could not read asset manifest file')
    }
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
      noCache: process.env.NODE_ENV !== 'production',
    },
  )
  njkEnv.addGlobal('homeUrl', config.apis.hmppsAuth.externalUrl)
  njkEnv.addGlobal('dpsUrl', config.app.dpsEndpointUrl)
  njkEnv.addGlobal('allowListEnvironment', manageUserAllowListHelper.environmentLabel())
  njkEnv.addGlobal('allowListSearchTitle', manageUserAllowListHelper.title())
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)
  njkEnv.addFilter('findError', (array: FormError[], formFieldId: string) => {
    if (!array) return null
    const item = array.find(error => error.href === `#${formFieldId}`)
    return item || null
  })
  njkEnv.addFilter('userTypeDisplay', (userType: string) => userTypeDisplay(userType as UserTypeKey))
  njkEnv.addFilter('userTypeShorthand', (userType: string) => userTypeShorthand(userType as UserTypeKey))
  njkEnv.addFilter('userTypeExistingUsernameLabel', (userType: string) =>
    userTypeExistingUsernameLabel(userType as UserTypeKey),
  )
  njkEnv.addFilter('userTypeExistingUsernameHint', (userType: string) =>
    userTypeExistingUsernameHint(userType as UserTypeKey),
  )
  njkEnv.addFilter('showCaseloadDropdown', (userType: string) => showCaseloadDropdown(userType as UserTypeKey))
  njkEnv.addFilter('caseloadTitle', (userType: string) => caseloadText(userType as UserTypeKey))
  njkEnv.addFilter('caseloadDropdownValues', (caseloads: PrisonCaseload[]) => caseloadDropdownValues(caseloads))
  njkEnv.addFilter('roleDropdownValues', (roles: Role[]) => roleDropdownValues(roles))
  njkEnv.addFilter('groupDropdownValues', (groups: UserGroup[]) => groupValues(groups))
  njkEnv.addFilter(
    'externalUserRoleDropdownValues',
    (roles: UserRole[]) => roles?.map(r => ({ text: r.roleName, value: r.roleCode })) ?? [],
  )

  njkEnv.addFilter('formatDate', (value: string, format: string) => (value ? moment(value).format(format) : null))
  njkEnv.addFilter('formatYesNo', (value: boolean) => (value ? 'Yes' : 'No'))
  njkEnv.addFilter('isRestrictedRoleCode', (roleCode: string, restrictedRoles: RestrictedRoles[]) =>
    isRestrictedRoleCode(roleCode, restrictedRoles),
  )
  njkEnv.addFilter('manageUserDetailsLink', (userId: string) => paths.dpsUser.manage.details({ userId }))
  njkEnv.addFilter('manageExternalUserDetailsLink', (userId: string) => paths.externalUser.manage.details({ userId }))
  njkEnv.addFilter('allowListUserView', (username: string) => paths.userAllowList.manage.view({ username }))
  njkEnv.addFilter('allowListUserEdit', (username: string) => paths.userAllowList.manage.edit({ username }))
  njkEnv.addFilter('toAllowListExpiry', (expiry: string) =>
    moment(expiry).diff(moment(), 'months') > 12 ? 'No restriction' : moment(expiry).format('D MMMM YYYY'),
  )
  njkEnv.addFilter('toAllowlistUserType', (userType: string) =>
    userAllowlistUserTypeDisplay(userType as UserAllowlistUserType),
  )
  njkEnv.addFilter('toStatus', (status: string) => statusDisplay(status as StatusKey))
  njkEnv.addFilter('deleteEmailDomainLink', (id: string) => paths.emailDomains.deleteWithId({ id }))

  njkEnv.addFilter(
    'setSelected',
    (items: SelectItem[], selected: string): SelectItem[] =>
      items &&
      items.map(entry => ({
        ...entry,
        selected: entry && entry.value === selected,
      })),
  )

  njkEnv.addFilter(
    'setChecked',
    (items: SelectItem[], selectedList): SelectItem[] =>
      items &&
      items.map(entry => ({
        ...entry,
        checked: entry && selectedList && selectedList.includes(entry.value),
      })),
  )
  njkEnv.addFilter('addBlankOptions', (values, text): SelectItem[] =>
    [
      { text: '', value: '' },
      { text, value: '' },
    ].concat(values),
  )
  njkEnv.addFilter(
    'toUserSearchFilter',
    (
      currentFilter: DpsUserFilter,
      prisons: PrisonCaseload[],
      roles: Role[],
      filterOptionsHtml: string,
      showGroupOrPrisonFilter: boolean,
    ) => {
      const categories = dpsUserFilterCategories(currentFilter, roles, prisons, showGroupOrPrisonFilter)

      return {
        heading: {
          text: 'Filters',
        },
        selectedFilters: {
          heading: {
            html: '<div class="moj-action-bar__filter"></div>',
          },
          clearLink: {
            text: 'Clear filters',
            href: `${paths.dpsUser.search.pattern}`,
          },
          categories: categories.filter(category => category.items),
        },
        optionsHtml: filterOptionsHtml,
      }
    },
  )
  njkEnv.addFilter('toRoleFilter', (currentFilter: RoleFilter, filterOptionsHtml: string) => {
    const categories = roleFilterCategories(currentFilter)

    return {
      heading: {
        text: 'Filters',
      },
      selectedFilters: {
        heading: {
          html: '<div class="moj-action-bar__filter"></div>',
        },
        clearLink: {
          text: 'Clear filters',
          href: `${paths.roles.list.pattern}`,
        },
        categories: categories.filter(category => category.items),
      },
      optionsHtml: filterOptionsHtml,
    }
  })
  njkEnv.addFilter(
    'toExternalUserSearchFilter',
    (currentFilter: ExternalUserFilter, groups: UserGroup[], roles: UserRole[], filterOptionsHtml: string) => {
      const categories = externalUserFilterCategories(currentFilter, roles, groups)
      return {
        heading: { text: 'Filters' },
        selectedFilters: {
          heading: { html: '<div class="moj-action-bar__filter"></div>' },
          clearLink: { text: 'Clear filters', href: `${paths.externalUser.search.pattern}` },
          categories: categories.filter(category => category.items),
        },
        optionsHtml: filterOptionsHtml,
      }
    },
  )
  njkEnv.addFilter('toAllowListFilter', (currentFilter: UserAllowListFilter, filterOptionsHtml: string) => {
    const categories = userAllowListFilterCategories(currentFilter)
    return {
      heading: { text: 'Filters' },
      selectedFilters: {
        heading: { html: '<div class="moj-action-bar__filter"></div>' },
        clearLink: { text: 'Clear filters', href: `${paths.userAllowList.search.pattern}` },
        categories: categories.filter(category => category.items),
      },
      optionsHtml: filterOptionsHtml,
    }
  })
}
