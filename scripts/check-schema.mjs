import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

console.log('🔍 Checking Current Database Schema...\n');

// Check categories table structure
const { data: categories, error: catError } = await supabase
  .from('categories')
  .select('*')
  .limit(1);

console.log('Categories table structure:', categories || catError);

// Check users table
const { data: users, error: userError } = await supabase
  .from('users')
  .select('*')
  .limit(1);

console.log('\nUsers table structure:', users || userError);

// Check if profiles table exists
const { data: profiles, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .limit(1);

console.log('\nProfiles table exists:', !profileError);

// Check articles table structure  
const { data: articles, error: artError } = await supabase
  .from('articles')
  .select('*')
  .limit(1);

console.log('\nArticles table structure:', articles || artError);
