const Router = require('express')
const router = new Router()
const basketController = require('../controllers/basketController')


router.get('/:id', basketController.getOne)
router.post('/addProduct', basketController.addProduct)

module.exports = router
