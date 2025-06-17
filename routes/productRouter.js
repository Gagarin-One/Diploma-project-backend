const Router = require('express')
const router = new Router()
const productController = require('../controllers/productController')


router.get('/', productController.getAll)
router.get('/:id', productController.getOne)
router.post('/create', productController.create)



module.exports = router
