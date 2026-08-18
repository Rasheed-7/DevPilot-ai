import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(' Missing Supabase credentials. Please check your .env file.');
  console.error('SUPABASE_URL:', supabaseUrl ? ' Set' : ' Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? ' Set' : ' Missing');
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

console.log(' Supabase URL:', supabaseUrl);
console.log(' Supabase Service Role Key: Present');

// Create client with proper options
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Test the connection immediately
const testConnection = async () => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.error(' Supabase connection test failed:', error.message);
      console.error('Please check your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    } else {
      console.log(' Supabase connection successful');
      console.log(' Available buckets:', buckets.map(b => b.name));
    }
  } catch (error) {
    console.error(' Supabase connection test error:', error.message);
  }
};

// Run the test
testConnection();

export default supabase;