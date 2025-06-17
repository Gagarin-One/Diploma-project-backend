const uuid = require('uuid')
const path = require('path');
const { Product, Seller, Category } = require('../models/models')
const ApiError = require('../error/ApiError');
const { Op, Sequelize } = require('sequelize');
const Fuse = require('fuse.js');
class ProductController {
    async create(req, res, next) {
        try {
            const { name, description, price, categoryId, sellerId } = req.body;
            console.log('BODY:', req.body);
            console.log('FILES:', req.files);
            console.log('name:', name, '| typeof:', typeof name);
            if (!name || !description || !price || !categoryId || !sellerId) {
                return next(ApiError.badRequest('Все поля (name, description, price, categoryId, sellerId) обязательны'));
            }

            if (!req.files || !req.files.img) {
                return next(ApiError.badRequest('Файл изображения не загружен'));
            }

            const { img } = req.files;

            // Генерация уникального имени файла и сохранение в static/
            const fileName = uuid.v4() + path.extname(img.name);
            const imagePath = path.resolve(__dirname, '..', 'static', fileName);
            await img.mv(imagePath); // Сохраняем файл

            console.log('Parsed:', {
                name,
                description,
                price: Number(price),
                categoryId: Number(categoryId),
                sellerId: Number(sellerId),
            });
            console.log('Creating product...');
            // Сохраняем ссылку на файл в БД (можно потом использовать, например: `/static/${fileName}`)
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const imageUrl = `${baseUrl}/${fileName}`;

            const product = await Product.create({
                name,
                description,
                price: Number(price),
                categoryId: Number(categoryId),
                sellerId: Number(sellerId),
                img_url: imageUrl, // Сохраняем полный URL
            });
            console.log('Product created:', product);

            return res.status(201).json(product);
        } catch (e) {
            console.error('Error in create product:', e);
            next(ApiError.badRequest(e.message));
        }
    }

    async getAll(req, res) {
        let { categoryId, sellerId, limit, page, searchString, priceSort } = req.query;
        page = page || 1;
        limit = limit || 9;
        let offset = (page - 1) * limit;
        let products;

        const whereClause = {};
        if (categoryId) {
            whereClause.categoryId = categoryId;
        }
        if (sellerId) {
            whereClause.sellerId = sellerId;
        }


        products = await Product.findAndCountAll({
            where: whereClause,
            limit: Number(limit),
            offset: Number(offset),
            order: priceSort === 'asc' || priceSort === 'desc' ? [['price', priceSort]] : undefined,
            include: [{
                model: Seller,
                as: 'seller',
                attributes: ['username']
            }]
        });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const formattedProducts = products.rows.map(product => ({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            img_url: `${baseUrl}/${product.img_url.replace(/^.*[\\/]/, '')}`, // нормализуем
            sellerName: product.seller.username,
            sellerId: product.sellerId,
            categoryId: product.categoryId
        }));

        // Если строка поиска передана
        if (searchString && searchString.trim()) {
            // Создаем объект Fuse.js с данными о товарах
            const fuse = new Fuse(formattedProducts, {
                keys: ['name'],  // Поле, по которому будет выполняться поиск
                threshold: 0.3,   // Порог сходства, ниже которого совпадения не будут отображаться
                includeScore: true,  // Включаем показатель сходства
            });

            // Фильтруем товары с помощью Fuse.js
            const searchResults = fuse.search(searchString.trim());

            // Получаем только отфильтрованные товары
            const filteredProducts = searchResults.map(result => result.item);

            return res.json({
                count: filteredProducts.length,
                rows: filteredProducts
            });
        }

        return res.json({
            count: products.count,
            rows: formattedProducts
        });
    }


    async getOne(req, res) {
        const { id } = req.params
        if (!id) {
            return next(ApiError.badRequest('Некорректные данные'));
        }
        try {
            const product = await Product.findOne(
                {
                    where: { id },
                    include: [{
                        model: Seller,
                        as: 'seller',
                        attributes: ['username']
                    },
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['name']
                    },
                    ]
                },
            )
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const response = {
                id: product.id,
                productName: product.name,
                description: product.description,
                price: product.price,
                img: `${baseUrl}/${product.img_url.replace(/^.*[\\/]/, '')}`,
                sellerName: product.seller.username,
                category: product.category.name
            };

            return res.json(response)

        } catch (error) {
            next(ApiError.badRequest(error.message));
        }
    }
}

module.exports = new ProductController()
