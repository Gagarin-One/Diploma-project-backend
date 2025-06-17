const ApiError = require('../error/ApiError');
const { OrderDetail, Order, Product, Basket, Basket_item } = require('../models/models');


class OrderController {
  async changeStatus(req, res, next) {

    let { status, orderId } = req.body

    if (!status) { return res.status(404).json({ message: 'empty status' }) }

    if (status !== 'pending' && status !== 'in processing' && status !== 'completed' && status !== 'dismissed') {
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
    const { userId, address, delivery_date } = req.body;
  
    if (!userId || !address || !delivery_date) {
      return res.status(400).json({ message: 'userId, address и delivery_date обязательны' });
    }
  
    try {
      const basket = await Basket.findOne({ where: { userId } });
  
      if (!basket) {
        return res.status(404).json({ message: 'Корзина не найдена для данного пользователя' });
      }
  
      const basketItems = await Basket_item.findAll({ where: { basketId: basket.id } });
  
      if (basketItems.length === 0) {
        return res.status(400).json({ message: 'Корзина пуста' });
      }
  
      const productIds = basketItems.map(item => item.productId);
      const products = await Product.findAll({ where: { id: productIds } });
  
      const sellerGroups = {};
  
      basketItems.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return;
  
        const sellerId = product.sellerId;
        if (!sellerGroups[sellerId]) {
          sellerGroups[sellerId] = [];
        }
  
        sellerGroups[sellerId].push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price
        });
      });
  
      const createdOrders = [];
  
      for (const sellerId in sellerGroups) {
        const sellerItems = sellerGroups[sellerId];
  
        const total_price = sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
        const newOrder = await Order.create({
          userId,
          sellerId,
          status: 'pending',
          total_price,
          address,
          delivery_date
        });
  
        const detailPromises = sellerItems.map(item =>
          OrderDetail.create({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity
          })
        );
  
        await Promise.all(detailPromises);
        createdOrders.push(newOrder);
      }
  
      await Basket_item.destroy({ where: { basketId: basket.id } });
  
      return res.json({ orders: createdOrders });
  
    } catch (error) {
      return next(ApiError.badRequest(error.message));
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
