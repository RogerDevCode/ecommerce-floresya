import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('❌ Variables SUPABASE_URL y SUPABASE_KEY requeridas');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;