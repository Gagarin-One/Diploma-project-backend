const Router = require('express')
const router = new Router()
const basketController = require('../controllers/basketController')


router.get('/:id', basketController.getOne)
router.post('/addProduct', basketController.addProduct)
router.put('/quantity', basketController.updateQuantity);
module.exports = router
