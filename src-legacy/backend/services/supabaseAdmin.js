import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

// Create admin client with service key
const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export { supabaseAdmin };
export default supabaseAdmin;