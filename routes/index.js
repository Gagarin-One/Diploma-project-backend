const Router = require('express')
const router = new Router()
const deviceRouter = require('./productRouter')
const userRouter = require('./userRouter')
const sellerRouter = require('./sellerRouter')
const reviewRouter = require('./reviewRouter')
const basketRouter = require('./basketRouter')
const categoryRouter = require('./categoryRouter')


router.use('/user', userRouter)
router.use('/seller', sellerRouter)
router.use('/product', deviceRouter)
router.use('/review', reviewRouter)
router.use('/basket', basketRouter)
router.use('/category', categoryRouter)

module.exports = router
