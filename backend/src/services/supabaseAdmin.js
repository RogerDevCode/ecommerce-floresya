const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create admin client with service key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = { supabaseAdmin };