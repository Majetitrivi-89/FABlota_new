import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function checkDatabase() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error("DATABASE_MISSING_TABLES:", error.message);
  } else {
    console.log("DATABASE_SUCCESS: Tables exist.");
  }
}

checkDatabase();
