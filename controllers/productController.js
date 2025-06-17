const uuid = require('uuid')
const path = require('path');
const { Product, Seller, Category } = require('../models/models')
const ApiError = require('../error/ApiError');
const { Op, Sequelize } = require('sequelize');
const Fuse = require('fuse.js');

class ProductController {
    async create(req, res, next) {
        try {
            const { name, description, price, categoryId, sellerId, measure } = req.body;

            console.log('BODY:', req.body);
            console.log('FILES:', req.files);

            if (!name || !description || !price || !categoryId || !sellerId) {
                return next(ApiError.badRequest('Все поля (name, description, price, categoryId, sellerId) обязательные'));
            }


            if (!req.files || !req.files.img) {
                return next(ApiError.badRequest('Файл изображения не загружен'));
            }

            const { img } = req.files;

            // Генерация уникального названия файла и сохраннение в static/
            const fileName = uuid.v4() + path.extname(img.name);
            const imagePath = path.resolve(__dirname, '..', 'static', fileName);
            await img.mv(imagePath);

            console.log('Parsed!', {
                name,
                description,
                price: Number(price),
                categoryId: Number(categoryId),
                sellerId: Number(sellerId),
                measure
            });

            // Сохраниаем ссылку на файл в БД
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const imageUrl = `${baseUrl}/${fileName}`;

            const product = await Product.create({ 
                name,
                description,
                price: Number(price),
                categoryId: Number(categoryId),
                sellerId: Number(sellerId),
                img_url: imageUrl,
                measure: measure ?? '' // по умолчанию — пустая строка
            });

            res.status(201).json(product);
        } catch (e) {
            console.error('Error in create product!', e);
            next(ApiError.badRequest(e.message)); 
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;

            if (!id) {
                return next(ApiError.badRequest('Не найден id товара'));
            }

            // На всякий случай найдем старый продукт
            const product = await Product.findOne({ where: { id } });
            if (!product) {
                return next(ApiError.badRequest('Товар с таким id не найден'));
            }

            // Получаем данные из тела запроса
            const { name, description, price, categoryId, measure } = req.body;

            if (!name && !description && !price && !categoryId && !req.files && !measure) {
                return next(ApiError.badRequest('Нет данных для изменения'));
            }

            // Если загружают картинку — сохраниваем по примеру с create
            let imagePath = product.img_url;

            if (req.files && req.files.img) {
                const { img } = req.files;

                // генератор уникального названия файла
                const fileName = uuid.v4() + path.extname(img.name);
                imagePath = path.resolve(__dirname, '..', 'static', fileName);
                await img.mv(imagePath);

                // генератор полного URL картинки
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                imagePath = `${baseUrl}/${fileName}`;
            }

            // Обновляем свойства
            product.name = name ?? product.name;
            product.description = description ?? product.description;
            product.price = price ? Number(price) : product.price;
            product.categoryId = categoryId ? Number(categoryId) : product.categoryId;
            product.measure = measure ?? product.measure;
            product.img_url = imagePath;

            await product.save();

            res.json(product);
        } catch (error) {
            console.error(error);
            return next(ApiError.badRequest(error.message)); 
        }
    }

    async getAll(req, res) {
        let { categoryId, sellerId, limit, page, searchString, priceSort } = req.query;
        page = page || 1;
        limit = limit || 9;
        let offset = (page - 1) * limit;

        const whereClause = {};
        if (categoryId) {
            whereClause.categoryId = categoryId;
        }
        if (sellerId) {
            whereClause.sellerId = sellerId;
        }

        const products = await Product.findAndCountAll({ 
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
            img_url: `${baseUrl}/${product.img_url.replace(/^.*[\\/]/, '')}`,
            sellerName: product.seller.username,
            sellerId: product.sellerId,
            categoryId: product.categoryId,
            measure: product.measure // поле с мерой
        }));

        // Если строка поиска передана
        if (searchString && searchString.trim()) {
            // Используем Fuse.js с полем name
            const fuse = new Fuse(formattedProducts, {
                keys: ['name'],  
                threshold: 0.3,   
                includeScore: true,
            });

            // Фильтрация с помощью Fuse.js
            const searchResults = fuse.search(searchString.trim());

            // Получаем только объекты с результата
            const filteredProducts = searchResults.map(result => result.item);

            return res.json({ count: filteredProducts.length, rows: filteredProducts });
        }

        return res.json({ count: products.count, rows: formattedProducts });
    }

    async getOne(req, res, next) {
        const { id } = req.params;

        if (!id) {
            return next(ApiError.badRequest('Некорректные данные'));
        }

        try {
            const product = await Product.findOne({ 
                where: { id },
                include: [
                    { 
                        model: Seller, 
                        as: 'seller',
                        attributes: ['username'] 
                    },
                    { 
                        model: Category, 
                        as: 'category',
                        attributes: ['name'] 
                    },
                ],
            });

            if (!product) {
                return res.status(404).json({ message: 'Товар не найден' });
            }

            const baseUrl = `${req.protocol}://${req.get('host')}`;

            const response = {
                id: product.id,
                productName: product.name,
                description: product.description,
                price: product.price,
                img: `${baseUrl}/${product.img_url.replace(/^.*[\\/]/, '')}`,
                sellerName: product.seller.username,
                category: product.category.name,
                measure: product.measure, // поле с мерой
                sellerId:product.sellerId
            };

            return res.json(response);
        } catch (error) {
            console.error(error);
            next(ApiError.badRequest(error.message)); 
        }
    }
}

module.exports = new ProductController();
