const { Sequelize } = require('sequelize');
const path = require('path');
const { supabase, testSupabaseConnection } = require('../services/supabaseClient');
require('dotenv').config();

// Define the path to the SQLite database file (legacy/fallback)
const DB_PATH = path.join(__dirname, '../../../database/floresya.db');

// Create a new Sequelize instance
let sequelize;
let useSupabase = false;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  // Use Supabase client
  useSupabase = true;
  console.log('🚀 Using Supabase client configuration');
} else if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD) {
  // Use PostgreSQL/Supabase configuration with connection string
  const connectionString = `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  sequelize = new Sequelize(connectionString, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
  });
  console.log('🐘 Using PostgreSQL/Supabase database configuration');
} else {
  // Fallback to SQLite
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: DB_PATH,
    logging: process.env.SQL_LOGGING === 'true' ? console.log : false,
  });
  console.log('🗃️ Using SQLite database configuration (fallback)');
}

// Function to test the database connection
const testConnection = async () => {
  if (useSupabase) {
    return await testSupabaseConnection();
  } else {
    try {
      await sequelize.authenticate();
      console.log('✅ Connection to the database has been established successfully.');
      return true;
    } catch (error) {
      console.error('❌ Unable to connect to the database:', error);
      return false;
    }
  }
};

// Export the sequelize instance, supabase client and the test function
module.exports = {
  sequelize,
  supabase,
  useSupabase,
  testConnection,
};
