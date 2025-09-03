const { Sequelize } = require('sequelize');
const { supabase, testSupabaseConnection } = require('../services/supabaseClient');
require('dotenv').config();

// Create a new Sequelize instance - PostgreSQL/Supabase ONLY
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
  // No fallback - PostgreSQL/Supabase required
  console.error('❌ ERROR: PostgreSQL/Supabase configuration required. Please set SUPABASE_URL and SUPABASE_ANON_KEY or PostgreSQL connection variables.');
  process.exit(1);
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

// Universal query function that works with both Supabase and Sequelize
const executeQuery = async (query, params = []) => {
  if (useSupabase) {
    // Convert SQL query to Supabase query
    // This is a simplified implementation - you may need to adapt based on specific queries
    try {
      // For simple SELECT queries
      if (query.toLowerCase().trim().startsWith('select')) {
        // Parse table name from query (basic parsing)
        const tableMatch = query.match(/from\s+(\w+)/i);
        if (!tableMatch) throw new Error('Could not parse table name');
        
        const tableName = tableMatch[1];
        
        // Handle WHERE conditions (basic implementation)
        if (query.includes('WHERE')) {
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
          
          if (error) throw error;
          return data || [];
        } else {
          const { data, error } = await supabase
            .from(tableName)
            .select('*');
          
          if (error) throw error;
          return data || [];
        }
      }
      
      // For other queries, we need direct SQL execution
      // This requires the service_role key for raw SQL
      console.warn('Non-SELECT query detected, may need service_role key');
      throw new Error('Complex queries not yet implemented for Supabase client mode');
      
    } catch (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
  } else {
    // Use Sequelize for PostgreSQL
    try {
      const [results] = await sequelize.query(query, {
        replacements: params,
        type: Sequelize.QueryTypes.SELECT
      });
      return results;
    } catch (error) {
      console.error('PostgreSQL query error:', error);
      throw error;
    }
  }
};

// Export the sequelize instance, supabase client and the test function
module.exports = {
  sequelize,
  supabase,
  useSupabase,
  testConnection,
  executeQuery,
};
