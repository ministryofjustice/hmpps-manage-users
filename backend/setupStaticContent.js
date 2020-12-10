const express = require('express')
const path = require('path')

const router = express.Router()

module.exports = () => {
  router.use(express.static(path.join(process.cwd(), '/build')))

  const assetPaths = [
    '/node_modules/govuk-frontend/govuk/assets',
    '/node_modules/govuk-frontend',
    '/node_modules/@ministryofjustice/frontend',
    '/node_modules/accessible-autocomplete/dist',
  ]
  assetPaths.forEach((dir) => {
    router.use('/assets', express.static(path.join(process.cwd(), dir)))
  })

  return router
}
