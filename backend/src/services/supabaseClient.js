const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Test connection function
const testSupabaseConnection = async () => {
  try {
    // Simple health check - get Supabase service status
    const { data, error } = await supabase.rpc('version');
    
    if (error && error.code !== 'PGRST202') {
      // PGRST202 is "function not found" but connection is working
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  testSupabaseConnection
};