const uuid = require('uuid')
const path = require('path');
const { Product} = require('../models/models')
const ApiError = require('../error/ApiError');

class ProductController {
    // async create(req, res, next) {
    //     try {
    //         let { name, description, price, categoryId } = req.body;
    //         const { img } = req.files;

    //         const userId = req.params.id || req.body.userId;
           

    //         // Генерация имени файла и сохранение изображения
    //         let fileName = uuid.v4() + ".jpg";
    //         img.mv(path.resolve(__dirname, '..', 'static', fileName));

    //         // Создание продукта
    //         const product = await Product.create({
    //             name,
    //             description,
    //             price,
    //             categoryId,
    //             userId,
    //             img: fileName
    //         });

    //         return res.json(product);
    //     } catch (e) {
    //         next(ApiError.badRequest(e.message));
    //     }
    // }

    async getAll(req, res) {
        let { categoryId,sellerId, limit, page } = req.query
        page = page || 1
        limit = limit || 9
        let offset = page * limit - limit
        let products;
        if (!categoryId && !sellerId) {
            products = await Product.findAndCountAll({ limit, offset })
        }
        if (categoryId && !sellerId) {
            products = await Product.findAndCountAll({ where: { categoryId }, limit, offset })
        }
        if (!categoryId && sellerId) {
            products = await Product.findAndCountAll({ where: { sellerId }, limit, offset })
        }
        if (categoryId && sellerId) {
            products = await Product.findAndCountAll({ where: { categoryId, sellerId }, limit, offset })
        }
        return res.json(products)
    }

    // async getOne(req, res) {
    //     const { id } = req.params
    //     const product = await Product.findOne(
    //         {
    //             where: { id },
    //         },
    //     )
    //     return res.json(product)
    // }
}

module.exports = new ProductController()
