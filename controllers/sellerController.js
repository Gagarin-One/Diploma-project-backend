const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {Seller} = require('../models/models')

const generateJwt = (id, username, email, isFarmer) => {
    return jwt.sign(
      { id, username, email, isFarmer },
      process.env.SECRET_KEY,
      { expiresIn: '24h' }
    );
  };
  
  class SellerController {
    async registration(req, res, next) {
      const { username, email, password } = req.body;
      if (!email || !password) {
        return next(ApiError.badRequest('Некорректный email или password'));
      }
  
      try {
        const candidate = await Seller.findOne({ where: { email } });
        if (candidate) {
          return next(ApiError.badRequest('Пользователь с таким email уже существует'));
        }
  
        const hashPassword = await bcrypt.hash(password, 5);
        const address = "fdfdf"; // временное значение
        const user = await Seller.create({ username, email, password: hashPassword, address });
  
        const token = generateJwt(user.id, user.username, user.email, true);
        return res.json({ token, isFarmer: true });
  
      } catch (error) {
        console.error(error);
        return next(ApiError.badRequest(error.message));
      }
    }
  
    async login(req, res, next) {
      const { email, password } = req.body;
  
      const user = await Seller.findOne({ where: { email } });
      if (!user) {
        return next(ApiError.internal('Пользователь не найден'));
      }
  
      const comparePassword = bcrypt.compareSync(password, user.password);
      if (!comparePassword) {
        return next(ApiError.internal('Указан неверный пароль'));
      }
  
      const token = generateJwt(user.id, user.username, user.email, true);
      return res.json({ token, isFarmer: true });
    }
  
    async check(req, res, next) {
      try {
        const userId = req.user.id;
  
        const user = await Seller.findOne({
          where: { id: userId },
          attributes: ['id', 'username', 'email'],
        });
  
        if (!user) {
          return res.status(404).json({ message: 'Пользователь не найден' });
        }
  
        const token = generateJwt(user.id, user.username, user.email, true);
        return res.json({ token, isFarmer: true });
  
      } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Ошибка сервера' });
      }
    }
  }
  
  module.exports = new SellerController();