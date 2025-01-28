const ApiError = require('../error/ApiError');
const { OrderDetail, Order, Product, Basket, Basket_item } = require('../models/models');


class OrderController {
  async changeStatus(req, res, next) {

    let { status, orderId } = req.body

    if (!status) { return res.status(404).json({ message: 'empty status' }) }

    if (status !== 'pending' && status !== 'ready_for_pickup') {
      return res.status(404).json({ message: 'invalid status' })
    }

    let order = await Order.findByPk(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    try {
      order.status = status
      await order.save();
      return res.json(order.status)
    } catch (err) {
      return next(ApiError.badRequest(error.message))
    }

  }
  async create(req, res, next) {
    let { userId, sellerId } = req.body

    if (!userId || !sellerId) { return res.status(404).json({ message: 'invalid data' }) }


    const basket = await Basket.findOne( { userId } );
    if (!basket) {
      throw new Error('Корзина не найдена для данного пользователя');
  }

    let orderDetails = await Basket_item.findAll({ where: {basketId:basket.id}})


    try {
      const productIds = orderDetails.map(detail => detail.productId);
      const products = await Product.findAll({
        where: {
          id: productIds,
        },
      });


      const productPrices = {};
      products.forEach(product => {
        productPrices[product.id] = product.price;
      });

      // Расчет total_price
      let total_price = 0;
      orderDetails.forEach(detail => {
        const price = productPrices[detail.productId] || 0;
        total_price += price * detail.quantity;
      });

      // новый заказ
      let newOrder = await Order.create({ userId, sellerId, status: 'pending', total_price })

      //  детали заказа
      let orderDetailsPromises = orderDetails.map(detail => {
        return OrderDetail.create({
          quantity: detail.quantity,
          orderId: newOrder.id,
          productId: detail.productId,

        })
      })

      // Ждем завершения всех операций по созданию деталей заказа

      await Promise.all(orderDetailsPromises);

      return res.json(newOrder)

    } catch (error) {
      next(ApiError.badRequest(error.message))
    }
  }

  async findForUser(req, res, next) {
    let { id } = req.params;
    if (!id) {
      return next(ApiError.badRequest('Некорректные данные'));
    }
    try {
      
      let userOrders = await Order.findAll({
        where: { userId: id },
        include: [{
          model: OrderDetail,
          as: 'order_details',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      });
      // Проверка, найдены ли заказы
      if (!userOrders.length) {
        return res.status(404).json({ message: 'Заказы не найдены для данного пользователя.' });
      }

      // Возврат найденных заказов
      return res.json(userOrders);


    } catch (error) {
      next(ApiError.badRequest(error.message));
    }
  }
  async findForSeller(req, res, next) {
    try {
      let { id } = req.params;
      if (!id) {
        return next(ApiError.badRequest('Некорректные данные'));
      }
      let sellerOrders = await Order.findAll({
        where: { sellerId: id },
        include: [{
          model: OrderDetail,
          as: 'order_details',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      });
      // Проверка, найдены ли заказы
      if (!sellerOrders.length) {
        return res.status(404).json({ message: 'Заказы не найдены для данного пользователя.' });
      }

      // Возврат найденных заказов
      return res.json(sellerOrders);


    } catch (error) {
      return next(ApiError.badRequest(error.message));
    }
  }
}

module.exports = new OrderController()
