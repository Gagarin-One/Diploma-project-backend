const sequelize = require('../db');
const { DataTypes } = require('sequelize');


const User = sequelize.define('user', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING }
});

const Seller = sequelize.define('seller', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING, allowNull: false }
});

const Basket = sequelize.define('basket', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
});

const Basket_item = sequelize.define('basket_item', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  }
});

const ReviewForSeller = sequelize.define('review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  review_text: { type: DataTypes.STRING, allowNull: false },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5
    }
  }
});


const Product = sequelize.define('product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, collate: 'und-ci' },
  description: { type: DataTypes.STRING, allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  img_url: { type: DataTypes.STRING, allowNull: false },
  measure: { 
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '' // по умолчанию — пустая строка
  }
});

const Category = sequelize.define('category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
});


const Order = sequelize.define('order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  total_price: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: {
        args: [['pending', 'in processing', 'completed', 'dismissed']],
        msg: "Status must be one of: 'pending', 'in processing', 'completed', 'dismissed'"
      }
    }
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  delivery_date: {
    type: DataTypes.DATE,
    allowNull: false,
  }
});

const OrderDetail = sequelize.define('order_detail', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  }
})

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  message: { type: DataTypes.STRING, allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
});


Seller.hasMany(Product);
Product.belongsTo(Seller);

User.hasMany(Basket);
Basket.belongsTo(User);

Basket.hasMany(Basket_item);
Basket_item.belongsTo(Basket);

Product.hasMany(Basket_item);
Basket_item.belongsTo(Product);

Category.hasMany(Product);
Product.belongsTo(Category);

User.hasMany(ReviewForSeller)
ReviewForSeller.belongsTo(User);

Seller.hasMany(ReviewForSeller)
ReviewForSeller.belongsTo(Seller);

User.hasMany(Order)
Order.belongsTo(User);

Seller.hasMany(Order)
Order.belongsTo(Seller);

Order.hasMany(OrderDetail)
OrderDetail.belongsTo(Order);

Product.hasMany(OrderDetail)
OrderDetail.belongsTo(Product);

Order.hasOne(ReviewForSeller);
ReviewForSeller.belongsTo(Order);

Notification.belongsTo(Seller);
Seller.hasMany(Notification);

module.exports = {
  User,
  Seller,
  Basket,
  Basket_item,
  Category,
  Product,
  ReviewForSeller,
  Order,
  OrderDetail,
  Notification
};
