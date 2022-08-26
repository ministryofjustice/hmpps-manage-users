const moment = require('moment')
const { DATE_TIME_FORMAT_SPEC } = require('../dateHelpers')

const capitalize = (string) => {
  if (typeof string !== 'string') return ''
  const lowerCase = string.toLowerCase()
  return lowerCase.charAt(0).toUpperCase() + lowerCase.slice(1)
}

const pascalToString = (value) =>
  value &&
  value.substring(0, 1) +
    value
      .substring(1)
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()

const isValidDateTimeFormat = (dateTimeString) => moment(dateTimeString, DATE_TIME_FORMAT_SPEC, true).isValid()

const getDate = (dateTimeString, format = 'dddd D MMMM YYYY') => {
  if (!isValidDateTimeFormat(dateTimeString)) return 'Invalid date or time'

  return moment(dateTimeString, DATE_TIME_FORMAT_SPEC).format(format)
}

const getTime = (dateTimeString) => {
  if (!isValidDateTimeFormat(dateTimeString)) return 'Invalid date or time'

  return moment(dateTimeString, DATE_TIME_FORMAT_SPEC).format('HH:mm')
}

const hyphenatedStringToCamel = (string) =>
  string.replace(/[-\s]([a-z])/g, (char) => {
    return char[1].toUpperCase()
  })

const trimObjValues = (obj) => Object.assign({}, ...Object.entries(obj).map(([k, v]) => ({ [k]: v ? v.trim() : v })))

const forenameToInitial = (name) => {
  if (!name) return null
  return `${name.charAt()}. ${name.split(' ').pop()}`
}

function removeForwardApostrophe(str) {
  return str !== undefined ? str.replace('’', "'") : undefined
}

module.exports = {
  capitalize,
  pascalToString,
  getDate,
  getTime,
  hyphenatedStringToCamel,
  trimObjValues,
  forenameToInitial,
  removeForwardApostrophe,
}
