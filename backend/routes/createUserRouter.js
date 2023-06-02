const express = require('express')
const { createUserFactory } = require('../controllers/createUser')

const router = express.Router({ mergeParams: true })

const controller = () => {
  const { index: createUser, post: postUser } = createUserFactory('/create-user-options')

  router.get('/', createUser)
  router.post('/', postUser)
  return router
}

module.exports = (dependencies) => controller(dependencies)
