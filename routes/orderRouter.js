const Router = require('express')
const router = new Router()
const orderController = require('../controllers/orderController')


router.post('/create', orderController.create)
router.get('/user/findAll/:id', orderController.findForUser)
router.get('/seller/findAll/:id', orderController.findForSeller)
router.put('/changeStatus', orderController.changeStatus)
router.get('/notifications/:id', orderController.getNotifications)
router.delete('/notifications/:id', orderController.clearNotifications)




module.exports = router