const Router = require('express')
const reviewController = require('../controllers/reviewController')
const router = new Router()


router.post('/create', reviewController.create)
router.get('/:id', reviewController.getAll)

module.exports = router