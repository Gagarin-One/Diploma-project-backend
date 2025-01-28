const Router = require('express')
const router = new Router()
const sellerController = require('../controllers/sellerController')
const authMiddleware = require('../middleware/authMiddleware')

router.post('/registration', sellerController.registration)
router.post('/login', sellerController.login)
router.get('/auth', authMiddleware, sellerController.check)

module.exports = router