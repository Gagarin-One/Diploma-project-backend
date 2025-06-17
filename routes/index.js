const Router = require('express')
const router = new Router()

const userRouter = require('./userRouter')
const sellerRouter = require('./sellerRouter')
const reviewRouter = require('./reviewRouter')
const basketRouter = require('./basketRouter')
const categoryRouter = require('./categoryRouter')
const orderRouter = require('./orderRouter')
const productRouter = require('./productRouter')


router.use('/user', userRouter)
router.use('/seller', sellerRouter)
router.use('/product', productRouter)
router.use('/review', reviewRouter)
router.use('/basket', basketRouter)
router.use('/category', categoryRouter)
router.use('/order', orderRouter)

module.exports = router
