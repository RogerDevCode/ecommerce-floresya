const { sequelize } = require('../config/database');
const Category = require('./Category');
const Product = require('./Product');
const Setting = require('./Setting');
const PaymentMethod = require('./PaymentMethod');
const CarouselImage = require('./CarouselImage');

const db = {
  sequelize,
  Sequelize: require('sequelize'),
  Category,
  Product,
  Setting,
  PaymentMethod,
  CarouselImage,
};

// Define associations here
// Example: A product belongs to a category
Product.belongsTo(Category, {
  foreignKey: 'category_id',
  as: 'category',
});
Category.hasMany(Product, {
  foreignKey: 'category_id',
  as: 'products',
});

// We will add other models and associations here later

module.exports = db;
