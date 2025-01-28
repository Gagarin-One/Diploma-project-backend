const ApiError = require('../error/ApiError');
const { Basket, Basket_item, Product } = require('../models/models');

class BasketController {
  async addProduct(req, res, next) {
    let { userId, productId, quantity } = req.body

    if (!userId || !productId || !quantity) {
      return next(ApiError.badRequest('Некорректные данные'));
    }

    try{
      let basket = await Basket.findOne({ where: { userId } })

      if (!basket) {
         basket = await Basket.create( { userId } )
      }
  
      let basketItem = await Basket_item.findOne({ where: { basketId: basket.id, productId } })
  
      if (basketItem) {
        basketItem.quantity += Number(quantity)
        await basketItem.save();
      } else {
        basketItem = await Basket_item.create({
         
            basketId: basket.id,
            productId,
            quantity
          
        })
      }
  
      return res.json(basketItem);
    }catch(error){
      return next(ApiError.badRequest(error.message));
    }
   
  }

  async getOne(req, res, next) {
    let { id } = req.params;
    if (!id) {
      return next(ApiError.badRequest('Некорректные данные'));
    }
    try {
      // Находим корзину для данного пользователя
      const basket = await Basket.findOne({
        where: { userId: id },
        include: [{
          model: Basket_item,
          as: 'basket_items',
          include: [{
            model: Product,
            as: 'product'
          }]
        }]
      });


      if (!basket) {
        return res.status(404).json({ message: 'Корзина не найдена' });
      }

      return res.json(basket.basket_items); // Возвращаем элементы корзины

    } catch (error) {
      return next(ApiError.badRequest(error.message));
    }
  }
}

module.exports = new BasketController();
