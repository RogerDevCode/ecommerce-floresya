const { sequelize, useSupabase } = require('../config/database');

let db;

if (useSupabase) {
  // When using Supabase, we don't need Sequelize models
  db = {
    useSupabase: true,
    sequelize: null,
    Sequelize: null,
    Category: null,
    Product: null,
    Setting: null,
    PaymentMethod: null,
    CarouselImage: null,
  };
} else {
  // Use Sequelize models
  const Category = require('./Category');
  const Product = require('./Product');
  const Setting = require('./Setting');
  const PaymentMethod = require('./PaymentMethod');
  const CarouselImage = require('./CarouselImage');

  db = {
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
}

module.exports = db;
