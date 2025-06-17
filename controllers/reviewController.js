const ApiError = require('../error/ApiError');
const { Order, ReviewForSeller, User } = require('../models/models');

class ReviewController {
  async create(req, res, next) {
    try {
      let { userId, sellerId, review, rating, orderId } = req.body;

      if (!userId || !sellerId || !review || !rating || !orderId) {
        return next(ApiError.badRequest('Некорректные данные'));
      }

      try {
        const order = await Order.findOne({
          where: {
            userId: userId,
            sellerId: sellerId,
          },
        });
        if (!order) {
          return next(ApiError.badRequest('Заказ не найден для данного пользователя и продавца'));
        }

        const newReview = await ReviewForSeller.create({
          review_text: review,
          rating: rating,
          userId: userId,
          sellerId: sellerId,
          orderId: orderId,
        });

        return res.json(newReview);
      } catch (error) {
        console.error(error);
        return next(ApiError.internal('Произошла ошибка при добавлении отзыва'));
      }
    } catch (error) {
      next(ApiError.badRequest(error.message));
    }
  }
  async getAll(req, res, next) {
    try {
      const { id } = req.params;
  
      if (!id) {
        return next(ApiError.badRequest('Некорректные данные'));
      }
  
      // Включаем также информацию о пользователе (например, имя)
      const reviews = await ReviewForSeller.findAll({ 
        where: { sellerId: id },
        
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username'] // вернем поле с именем пользователя
          }
        ],
      });
  
      return res.json(reviews);
    } catch (error) {
      console.error(error);
      return next(ApiError.badRequest(error.message));
    }
  }
}

module.exports = new ReviewController();
