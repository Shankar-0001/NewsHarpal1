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

console.log('🧪 Testing User Creation...\n');

// Try to create a test user
const testEmail = `test-${Date.now()}@example.com`;
const { data, error } = await supabase.auth.admin.createUser({
  email: testEmail,
  password: 'Test@123456',
  email_confirm: true
});

if (error) {
  console.error('❌ Error creating user:', error);
  console.error('Error code:', error.code);
  console.error('Error status:', error.status);
  console.error('Error message:', error.message);
} else {
  console.log('✅ User created successfully:', data.user.id);
  
  // Check if user was added to public.users
  const { data: publicUser, error: publicError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
    
  if (publicError) {
    console.error('❌ User not in public.users table:', publicError.message);
  } else {
    console.log('✅ User found in public.users:', publicUser);
  }
  
  // Clean up - delete test user
  await supabase.auth.admin.deleteUser(data.user.id);
  console.log('✅ Test user deleted');
}
