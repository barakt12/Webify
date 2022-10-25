const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { getById, deleteUser, updateUser } = require('./user.controller')
const router = express.Router()

// middleware that is specific to this router
// router.use(requireAuth)

// router.get('/', getWaps)
router.get('/:id', getById)
// router.post('/', requireAuth, )
// router.put('/:id', requireAuth)
// router.delete('/:id', requireAuth, )

module.exports = router
