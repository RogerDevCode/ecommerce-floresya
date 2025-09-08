const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { logger, startTimer } = require('../utils/logger');

// Load environment variables from root directory
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Validate required environment variables
const validateEnvironment = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error('SUPABASE', error, { missing });
    throw new Error(error);
  }
  
  logger.info('SUPABASE', 'Environment variables validated', {
    url: process.env.SUPABASE_URL?.substring(0, 30) + '...',
    hasAnonKey: !!process.env.SUPABASE_ANON_KEY,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
  });
};

// Validate environment before creating client
validateEnvironment();

// Create Supabase client with enhanced configuration
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'floresya-backend@1.0.0'
      }
    }
  }
);

// Test connection function with comprehensive checks
const testSupabaseConnection = async () => {
  const timer = startTimer('supabase-connection-test');
  
  try {
    logger.info('SUPABASE', 'Testing Supabase connection...');
    
    // Test 1: Basic auth endpoint
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    // Test 2: Database connectivity - try to get tables info
    const { data: tablesData, error: tablesError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (tablesError && !tablesError.message.includes('relation "products" does not exist')) {
      throw tablesError;
    }
    
    timer.end();
    
    logger.success('SUPABASE', 'Connection test successful', {
      authEndpoint: !authError,
      databaseEndpoint: !tablesError || tablesError.message.includes('relation'),
      tablesAccessible: !tablesError
    });
    
    return true;
  } catch (error) {
    timer.end();
    
    logger.error('SUPABASE', 'Connection test failed', {
      error: error.message,
      code: error.code,
      details: error.details
    }, error);
    
    return false;
  }
};

// Health check function for monitoring
const getSupabaseHealth = async () => {
  const health = {
    status: 'unknown',
    timestamp: new Date().toISOString(),
    services: {
      auth: false,
      database: false,
      storage: false
    },
    metrics: {
      responseTime: 0,
      uptime: process.uptime()
    }
  };
  
  const timer = startTimer('supabase-health-check');
  const startTime = Date.now();
  
  try {
    // Test auth service
    const { error: authError } = await supabase.auth.getSession();
    health.services.auth = !authError;
    
    // Test database service
    const { error: dbError } = await supabase
      .from('products')
      .select('count')
      .limit(1);
    health.services.database = !dbError || dbError.message.includes('relation');
    
    // Test storage service
    const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
    health.services.storage = !storageError;
    
    timer.end();
    health.metrics.responseTime = Date.now() - startTime;
    
    // Determine overall status
    const serviceCount = Object.values(health.services).filter(Boolean).length;
    if (serviceCount === 3) {
      health.status = 'healthy';
    } else if (serviceCount >= 2) {
      health.status = 'degraded';
    } else {
      health.status = 'unhealthy';
    }
    
    logger.info('SUPABASE', 'Health check completed', health);
    
  } catch (error) {
    timer.end('SUPABASE');
    health.status = 'error';
    health.error = error.message;
    
    logger.error('SUPABASE', 'Health check error', { error: error.message }, error);
  }
  
  return health;
};

module.exports = {
  supabase,
  testSupabaseConnection,
  getSupabaseHealth
};