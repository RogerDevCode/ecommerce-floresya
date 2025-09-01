const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  category_id: {
    type: DataTypes.INTEGER,
  },
  stock_quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  image_url: {
    type: DataTypes.STRING(255),
  },
  additional_images: {
    type: DataTypes.JSON,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  show_on_homepage: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  homepage_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  occasion: {
    type: DataTypes.ENUM('amor', 'birthday', 'anniversary', 'graduation', 'friendship', 'condolencia', 'mother', 'yellow_flower', 'wedding', 'valentine', 'funeral', 'other'),
    defaultValue: 'other',
  },
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Product;
