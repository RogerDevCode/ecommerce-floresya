const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CarouselImage = sequelize.define('CarouselImage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  link_url: {
    type: DataTypes.STRING(500),
  },
  display_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'carousel_images',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = CarouselImage;