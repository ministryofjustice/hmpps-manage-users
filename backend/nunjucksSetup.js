const moment = require('moment')
const nunjucks = require('nunjucks')
const querystring = require('querystring')

const config = require('./config')
const { getDate, getTime, pascalToString, capitalize, hyphenatedStringToCamel } = require('./utils')

module.exports = (app, path) => {
  const njkEnv = nunjucks.configure(
    [path.join(__dirname, '../views'), 'node_modules/govuk-frontend/', 'node_modules/@ministryofjustice/frontend/'],
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
  njkEnv.addGlobal('homeUrl', config.apis.oauth2.ui_url)
  njkEnv.addGlobal('dpsUrl', config.app.dpsEndpointUrl)
  njkEnv.addGlobal('supportUrl', config.app.supportUrl)
  njkEnv.addGlobal('googleTagManagerId', config.analytics.googleTagManagerId)

  njkEnv.addFilter(
    'toUserSearchFilter',
    (currentFilter, prisons, roles, filterOptionsHtml, showGroupOrPrisonFilter) => {
      const hrefBase = '/search-with-filter-dps-users?'
      const usernameTags = getUsernameTags(currentFilter, hrefBase)
      const caseloadTags = getCaseloadTags(currentFilter, hrefBase, prisons)
      const rolesTags = getRoleTags(currentFilter, hrefBase, roles)
      const statusTags = getStatusTags(currentFilter, hrefBase)
      const categories = [
        {
          heading: {
            text: 'User',
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
      ]

      if (showGroupOrPrisonFilter) {
        categories.splice(2, 0, {
          heading: {
            text: 'Caseload',
          },
          items: caseloadTags,
        })
      }

      return {
        heading: {
          text: 'Filter',
        },
        selectedFilters: {
          heading: {
            text: 'Selected filters',
          },
          clearLink: {
            text: 'Clear filters',
            href: '/search-with-filter-dps-users',
          },
          categories,
        },
        optionsHtml: filterOptionsHtml,
      }
    },
  )

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
        text: toStatusDesctiption(status),
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

function toStatusDesctiption(status) {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'INACTIVE':
      return 'Inactive'
    default:
      return status
  }
}
