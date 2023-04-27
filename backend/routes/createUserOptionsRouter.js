const express = require('express')
const { createLinkedDpsUserDecisionFactory } = require('../controllers/createLinkedDpsUserDecision')

const router = express.Router({ mergeParams: true })

const controller = () => {
  const { index, post } = createLinkedDpsUserDecisionFactory('/create-linked-dps-user')

  router.get('/', index)
  router.post('/', post)
  return router
}

module.exports = (dependencies) => controller(dependencies)
