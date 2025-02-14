const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/models');

const generateJwt = (id, username, email) => {
  return jwt.sign({ id, username, email }, process.env.SECRET_KEY, { expiresIn: '24h' });
};

class UserController {
  async registration(req, res, next) {
    const { username, email, password } = req.body;
    if (!email || !password) {
      return next(ApiError.badRequest('Некорректный email или password'));
    }

    try {
      const candidate = await User.findOne({ where: { email } });
      if (candidate) {
        return next(ApiError.badRequest('Пользователь с таким email уже существует'));
      }
      const hashPassword = await bcrypt.hash(password, 5);
      const user = await User.create({ username, email, password: hashPassword });
      const token = generateJwt(user.id, user.username, user.email);
      return res.json({ token });
    } catch (error) {
      console.error(error);
     
      // Для других ошибок
      return next(ApiError.internal('Произошла ошибка при регистрации'));
    }
  }

  async login(req, res, next) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(ApiError.internal('Пользователь не найден'));
    }
    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return next(ApiError.internal('Указан неверный пароль'));
    }
    const token = generateJwt(user.id, user.username, user.email);
    return res.json({ token });
  }

  async check(req, res, next) {
    try {
      // Предполагаем, что данные пользователя уже добавлены в req.user middleware
      const userId = req.user.id;
  
      // Запрашиваем данные пользователя из базы данных
      const user = await User.findOne({
        where: { id: userId },
        attributes: ['id', 'username', 'email',], // Указываем, какие поля мы хотим вернуть
      });
  
      // Проверяем, найден ли пользователь
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }
  
      // Возвращаем данные пользователя
      
      const token = generateJwt(user.id, user.username, user.email);
      return res.json({ user, token });

    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Ошибка сервера' });
    }
  }
}

module.exports = new UserController();
