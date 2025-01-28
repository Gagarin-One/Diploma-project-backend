const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {Seller} = require('../models/models')

const generateJwt = (id,username, email) => {
    return jwt.sign(
        {id,username, email},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}

class SellerController {
    async registration(req, res, next) {
        const {username, email, password, address} = req.body
        if (!email || !password) {
            return next(ApiError.badRequest('Некорректный email или password'))
        }
        try{
        const candidate = await Seller.findOne({where: {email}})
        if (candidate) {
            return next(ApiError.badRequest('Пользователь с таким email уже существует'))
        }
        const hashPassword = await bcrypt.hash(password, 5)
        const user = await Seller.create({username, email, password: hashPassword, address})
        const token = generateJwt(user.id,user.username, user.email)
        return res.json({token})
        } catch (error){
            console.error(error);
     

            return next(ApiError.badRequest(error.message))
        }

    }

    async login(req, res, next) {
        const {email, password} = req.body
        const user = await Seller.findOne({where: {email}})
        if (!user) {
            return next(ApiError.internal('Пользователь не найден'))
        }
        let comparePassword = bcrypt.compareSync(password, user.password)
        if (!comparePassword) {
            return next(ApiError.internal('Указан неверный пароль'))
        }
        const token = generateJwt(user.id,user.username, user.email)
        return res.json({token})
    }

    async check(req, res, next) {
        const token = generateJwt(req.user.id, req.user.username, req.user.email)
        return res.json({token})
    }
}

module.exports = new SellerController()




