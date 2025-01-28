const ApiError = require('../error/ApiError');
const { Order, ReviewForSeller } = require('../models/models');

class ReviewController {
  async create(req, res, next) {
    try {
      let { userId, sellerId, review, rating } = req.body;

      if (!userId || !sellerId || !review || !rating) {
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
          orderId: order.id,
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
      let { id } = req.params;
      if (!id) {
        return next(ApiError.badRequest('Некорректные данные'));
      }
      const reviews = await ReviewForSeller.findAll({ where: { sellerId: id } });
      return res.json(reviews);
    } catch (error) {
      console.error(error);
      return next(ApiError.badRequest(error.message))
    }
  }
}

module.exports = new ReviewController();
