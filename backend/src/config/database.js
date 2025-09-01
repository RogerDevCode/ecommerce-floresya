const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Define the path to the SQLite database file
const DB_PATH = path.join(__dirname, '../../../database/floresya.db');

// Create a new Sequelize instance
// It will connect to a SQLite database.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  // Disable logging of SQL queries to the console, can be enabled for debugging
  logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
});

// Function to test the database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to the database has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
};

// Export the sequelize instance and the test function
module.exports = {
  sequelize,
  testConnection,
};
