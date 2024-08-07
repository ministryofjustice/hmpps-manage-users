const { serviceCheckFactory } = require('../controllers/healthCheck')

const service = (name, url) => {
  const healthUrl = `${url.replace(/\/$/, '')}/health/ping`
  const check = serviceCheckFactory(name, healthUrl)
  return () =>
    check()
      .then((result) => ({ name, status: 'UP', message: result }))
      .catch((err) => ({ name, status: 'ERROR', message: err }))
}

const gatherCheckInfo = (total, currentValue) => ({ ...total, [currentValue.name]: currentValue.message })

const getBuild = () => {
  try {
    // @ts-ignore
    // eslint-disable-next-line import/no-unresolved,global-require
    return require('../../build-info.json')
  } catch (ex) {
    return null
  }
}

const addAppInfo = (result) => {
  const buildInformation = getBuild()
  const buildInfo = {
    uptime: process.uptime(),
    build: buildInformation,
    version: (buildInformation && buildInformation.buildNumber) || 'Not available',
  }

  return { ...result, ...buildInfo }
}

module.exports = function healthcheckFactory(hmppsAuthUrl, manageUsersUrl, tokenVerificationUrl) {
  const checks = [
    service('hmppsAuth', hmppsAuthUrl),
    service('manageUsers', manageUsersUrl),
    service('tokenVerification', tokenVerificationUrl),
  ]

  return (callback) =>
    Promise.all(checks.map((fn) => fn())).then((checkResults) => {
      const allOk = checkResults.every((item) => item.status === 'UP') ? 'UP' : 'DOWN'
      const result = {
        name: 'hmpps-manage-users',
        status: allOk,
        api: checkResults.reduce(gatherCheckInfo, {}),
      }
      callback(null, addAppInfo(result))
    })
}
