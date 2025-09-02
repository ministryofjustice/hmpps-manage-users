const moment = require('moment')
const nunjucks = require('nunjucks')
const querystring = require('querystring')
const paths = require('../routes/paths').default

const config = require('../config').default
const { getDate, getTime, pascalToString, capitalize, hyphenatedStringToCamel } = require('./utils')
const { RestrictedRolesService } = require('../services/restrictedRolesService')

module.exports = (app, path) => {
  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  njkEnv.addFilter('findError', (array, formFieldId) => {
    if (!array) return null
    const item = array.find((error) => error.href === `#${formFieldId}`)
    if (item) {
      return {
        text: item.text,
      }
    }
    return null
  })

  njkEnv.addFilter('addBlankOptions', (values, text) =>
    [
      { text: '', value: '' },
      { text, value: '' },
    ].concat(values),
  )

  njkEnv.addFilter('findErrors', (errors, formFieldIds) => {
    if (!errors) return null
    const fieldIds = formFieldIds.map((field) => `#${field}`)
    const errorIds = errors.map((error) => error.href)
    const firstPresentFieldError = fieldIds.find((fieldId) => errorIds.includes(fieldId))
    if (firstPresentFieldError) {
      return { text: errors.find((error) => error.href === firstPresentFieldError).text }
    }
    return null
  })

  njkEnv.addFilter('formatDate', (value, format) => (value ? moment(value).format(format) : null))

  njkEnv.addFilter('formatYesNo', (value) => (value ? 'Yes' : 'No'))

  njkEnv.addFilter('hasErrorWithPrefix', (errorsArray, prefixes) => {
    if (!errorsArray) return null
    const formattedPrefixes = prefixes.map((field) => `#${field}`)
    return errorsArray.some((error) => formattedPrefixes.some((prefix) => error.href.startsWith(prefix)))
  })

  njkEnv.addFilter('toTextValue', (array, selected) => {
    if (!array) return null

    const items = array.map((entry) => ({
      text: entry,
      value: entry,
      selected: entry && entry === selected,
    }))

    return [
      {
        text: '--',
        value: '',
        hidden: true,
        selected: true,
      },
      ...items,
    ]
  })

  njkEnv.addFilter('addDefaultSelectedValue', (items, text, show) => {
    if (!items) return null
    const attributes = {}
    if (!show) attributes.hidden = ''

    return [
      {
        text,
        value: '',
        selected: true,
        attributes,
      },
      ...items,
    ]
  })

  njkEnv.addFilter(
    'setSelected',
    (items, selected) =>
      items &&
      items.map((entry) => ({
        ...entry,
        selected: entry && entry.value === selected,
      })),
  )

  njkEnv.addFilter(
    'setChecked',
    (items, selectedList) =>
      items &&
      items.map((entry) => ({
        ...entry,
        checked: entry && selectedList && selectedList.includes(entry.value),
      })),
  )

  njkEnv.addFilter(
    'setDisabled',
    (items, currentSelectedList) =>
      items &&
      items.map((entry) => ({
        ...entry,
        disabled: entry && currentSelectedList && currentSelectedList.includes(entry.value) && entry.immutable,
      })),
  )

  njkEnv.addFilter('toSummaryViewModel', (model) =>
    Object.keys(model)
      .filter((key) => model[key])
      .map((key) => ({
        key: { text: capitalize(pascalToString(key)) },
        value: { text: model[key], classes: `qa-${hyphenatedStringToCamel(key)}-value` },
      })),
  )

  njkEnv.addFilter(
    'removePaddingBottom',
    (items) =>
      items &&
      items.map((entry) => ({
        key: {
          ...entry.key,
          classes: 'govuk-!-padding-bottom-0',
        },
        value: {
          ...entry.value,
          classes: `${entry.value.classes} govuk-!-padding-bottom-0`,
        },
      })),
  )

  njkEnv.addFilter(
    'longLabel',
    (items) =>
      items &&
      items.map((entry) => ({
        key: {
          ...entry.key,
          classes: `${entry.key.classes} govuk-!-width-one-half`,
        },
        value: {
          ...entry.value,
          classes: `${entry.value.classes} govuk-!-width-one-half`,
        },
      })),
  )

  njkEnv.addFilter('showDefault', (value, specifiedText) => {
    if (value === 0) return value

    return value || specifiedText || '--'
  })
  njkEnv.addFilter('getDate', getDate)
  njkEnv.addFilter('getTime', getTime)
  njkEnv.addFilter('truthy', (data) => Boolean(data))
  njkEnv.addGlobal('homeUrl', config.apis.hmppsAuth.externalUrl)
  njkEnv.addGlobal('dpsUrl', config.app.dpsEndpointUrl)
  njkEnv.addGlobal('supportUrl', config.app.supportUrl)
  njkEnv.addGlobal('googleTagManagerId', config.analytics.googleTagManagerId)
  njkEnv.addGlobal('allowListEnvironment', config.featureSwitches.manageUserAllowList.environmentLabel)
  njkEnv.addGlobal(
    'allowListSearchTitle',
    `Search the ${config.featureSwitches.manageUserAllowList.environmentLabel} allow list`,
  )
  njkEnv.addFilter('allowListUserView', (username) => paths.userAllowList.viewUser({ username }))
  njkEnv.addFilter('allowListUserEdit', (username) => paths.userAllowList.editUser({ username }))
  njkEnv.addFilter('toAllowListExpiry', (expiry) =>
    moment(expiry).diff(moment(), 'months') > 12 ? 'No restriction' : moment(expiry).format('D MMMM YYYY'),
  )
  njkEnv.addFilter('toStatus', (status) => toStatusDescription(status))
  njkEnv.addFilter('isRestrictedRoleCode', (roleCode, restrictedRoles) => {
    const service = new RestrictedRolesService(restrictedRoles)
    return service.isRestrictedRoleCode(roleCode)
  })

  njkEnv.addFilter(
    'toUserSearchFilter',
    (currentFilter, prisons, roles, filterOptionsHtml, showGroupOrPrisonFilter) => {
      const hrefBase = '/search-with-filter-dps-users?'
      const usernameTags = getUsernameTags(currentFilter, hrefBase)
      const caseloadTags = getCaseloadTags(currentFilter, hrefBase, prisons)
      const rolesTags = getRoleTags(currentFilter, hrefBase, roles)
      const statusTags = getStatusTags(currentFilter, hrefBase)
      const roleInclusivity = getRoleInclusivity(currentFilter, hrefBase)
      const showOnlyLSAsTags = getShowOnlyLSAsTags(currentFilter, hrefBase)

      const categories = [
        {
          heading: {
            text: 'Name',
          },
          items: usernameTags,
        },
        {
          heading: {
            text: 'Status',
          },
          items: statusTags,
        },
        {
          heading: {
            text: 'Roles',
          },
          items: rolesTags,
        },
        {
          heading: {
            text: 'Role match',
          },
          items: roleInclusivity,
        },
        {
          heading: {
            text: 'Local System Administrator',
          },
          items: showOnlyLSAsTags,
        },
      ]

      if (showGroupOrPrisonFilter) {
        categories.splice(2, 0, {
          heading: {
            text: 'Prison',
          },
          items: caseloadTags,
        })
      }

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
            href: '/search-with-filter-dps-users',
          },
          categories: categories.filter((category) => category.items),
        },
        optionsHtml: filterOptionsHtml,
      }
    },
  )

  njkEnv.addFilter('toAllowListFilter', (currentFilter, filterOptionsHtml) => {
    const hrefBase = `${paths.userAllowList.search({})}?`
    const usernameTags = getUsernameTags(currentFilter, hrefBase)
    const statusTags = getStatusTags(currentFilter, hrefBase)

    const categories = [
      {
        heading: {
          text: 'Name',
        },
        items: usernameTags,
      },
      {
        heading: {
          text: 'Status',
        },
        items: statusTags,
      },
    ]

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
          href: `${paths.userAllowList.search({})}`,
        },
        categories: categories.filter((category) => category.items),
      },
      submit: {
        attributes: { 'data-qa': 'apply-filter-button' },
      },
      optionsHtml: filterOptionsHtml,
    }
  })

  njkEnv.addFilter('toExternalUserSearchFilter', (currentFilter, groups, roles, filterOptionsHtml) => {
    const hrefBase = '/search-external-users?'
    const usernameTags = getUsernameTags(currentFilter, hrefBase)
    const statusTags = getStatusTags(currentFilter, hrefBase)
    const rolesTags = getRoleCodeNameTags(currentFilter, hrefBase, roles)
    const groupsTags = getGroupCodeTags(currentFilter, hrefBase, groups)

    const categories = [
      {
        heading: {
          text: 'Name',
        },
        items: usernameTags,
      },
      {
        heading: {
          text: 'Status',
        },
        items: statusTags,
      },
      {
        heading: {
          text: 'Group',
        },
        items: groupsTags,
      },
      {
        heading: {
          text: 'Role',
        },
        items: rolesTags,
      },
    ]

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
          href: '/search-external-users',
        },
        categories: categories.filter((category) => category.items),
      },
      optionsHtml: filterOptionsHtml,
    }
  })

  njkEnv.addFilter('roleFilter', (currentFilter, filterOptionsHtml) => {
    const hrefBase = '/manage-roles?'
    const roleNameTags = getRoleNameTags(currentFilter, hrefBase)
    const roleCodeTags = getRoleCodeTags(currentFilter, hrefBase)
    const adminTags = getAdminTags(currentFilter, hrefBase)
    const categories = [
      {
        heading: {
          text: 'Role name',
        },
        items: roleNameTags,
      },
      {
        heading: {
          text: 'Role code',
        },
        items: roleCodeTags,
      },
      {
        heading: {
          text: 'Role administrator',
        },
        items: adminTags,
      },
    ]

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
          href: '/manage-roles',
        },
        categories: categories.filter((category) => category.items),
      },
      optionsHtml: filterOptionsHtml,
    }
  })

  return njkEnv
}

function getUsernameTags(currentFilter, hrefBase) {
  const { user, ...newFilter } = currentFilter
  if (user) {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: user,
      },
    ]
  }
  return undefined
}

function getStatusTags(currentFilter, hrefBase) {
  const { status, ...newFilter } = currentFilter
  if (status && status !== 'ALL') {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: toStatusDescription(status),
      },
    ]
  }
  return undefined
}

function getCaseloadTags(currentFilter, hrefBase, prisons) {
  const { groupCode, ...currentFilterNoCaseloads } = currentFilter

  let tags = groupCode?.map((caseload) => {
    const newFilter = { ...currentFilterNoCaseloads, groupCode: groupCode.filter((c) => c !== caseload) }
    if (newFilter.groupCode.length === 0) {
      delete newFilter.restrictToActiveGroup
    }
    return {
      // TODO look at using new URLSearchParams instead
      href: `${hrefBase}${querystring.stringify(newFilter)}`,
      text: prisons.find((prison) => prison.value === caseload)?.text,
    }
  })

  if (groupCode && currentFilter.restrictToActiveGroup) {
    const newFilter = { ...currentFilter, restrictToActiveGroup: false }
    tags = [
      ...tags,
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: 'Active caseload only',
      },
    ]
  }

  return tags
}

function getRoleCodeNameTags(currentFilter, hrefBase, roles) {
  const { roleCode, ...newFilter } = currentFilter
  if (roleCode) {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: roles.find((role) => role.value === roleCode).text,
      },
    ]
  }
  return undefined
}

function getGroupCodeTags(currentFilter, hrefBase, groups) {
  const { groupCode, ...newFilter } = currentFilter
  if (groupCode) {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: groups.find((group) => group.value === groupCode).text,
      },
    ]
  }
  return undefined
}

function getRoleTags(currentFilter, hrefBase, roles) {
  const { roleCode, ...currentFilterNoRoles } = currentFilter

  return roleCode?.map((role) => {
    const newFilter = { ...currentFilterNoRoles, roleCode: roleCode.filter((r) => r !== role) }
    return {
      // TODO look at using new URLSearchParams instead
      href: `${hrefBase}${querystring.stringify(newFilter)}`,
      text: roles.find((r) => r.value === role)?.text,
    }
  })
}

function getRoleNameTags(currentFilter, hrefBase) {
  const { roleName, ...newFilter } = currentFilter
  if (roleName) {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: roleName,
      },
    ]
  }
  return undefined
}

function getRoleCodeTags(currentFilter, hrefBase) {
  const { roleCode, ...newFilter } = currentFilter
  if (roleCode) {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: roleCode,
      },
    ]
  }
  return undefined
}

function getRoleInclusivity(currentFilter, hrefBase) {
  const { inclusiveRoles, ...newFilter } = currentFilter
  if (inclusiveRoles === 'true') {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: 'Any',
      },
    ]
  }
  return undefined
}

function getShowOnlyLSAsTags(currentFilter, hrefBase) {
  const { showOnlyLSAs, ...newFilter } = currentFilter
  if (showOnlyLSAs === 'true') {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: 'Only',
      },
    ]
  }
  return undefined
}

function getAdminTags(currentFilter, hrefBase) {
  const { adminTypes, ...newFilter } = currentFilter
  if (adminTypes && adminTypes !== 'ALL') {
    return [
      {
        // TODO look at using new URLSearchParams instead
        href: `${hrefBase}${querystring.stringify(newFilter)}`,
        text: toStatusDescription(adminTypes),
      },
    ]
  }
  return undefined
}

function toStatusDescription(status) {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'INACTIVE':
      return 'Inactive'
    default:
      return status
  }
}
