// Test script to verify refunds table access
// Run this in the browser console on the admin refunds page

console.log('🧪 Testing refunds table access...');

// Test 1: Check if we can access the refunds table
async function testRefundsAccess() {
  try {
    console.log('🔍 Testing refunds table access...');

    const { data, error } = await supabase.from('refunds').select('*').limit(5);

    console.log('📊 Refunds query result:', { data, error });

    if (error) {
      console.error('❌ Error accessing refunds table:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
    } else {
      console.log('✅ Successfully accessed refunds table!');
      console.log('📈 Found', data?.length || 0, 'refunds');
    }

    return { data, error };
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { data: null, error: err };
  }
}

// Test 2: Check current user authentication
async function testAuth() {
  try {
    console.log('🔍 Testing authentication...');

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    console.log('👤 Current user:', user);
    console.log('🔐 Auth error:', error);

    if (user) {
      console.log('✅ User is authenticated:', user.email);
    } else {
      console.error('❌ User is not authenticated');
    }

    return { user, error };
  } catch (err) {
    console.error('❌ Auth error:', err);
    return { user: null, error: err };
  }
}

// Test 3: Check bank_users table access
async function testBankUsersAccess() {
  try {
    console.log('🔍 Testing bank_users table access...');

    const { data, error } = await supabase
      .from('bank_users')
      .select('id, email, full_name')
      .limit(5);

    console.log('👥 Bank users query result:', { data, error });

    if (error) {
      console.error('❌ Error accessing bank_users table:', error);
    } else {
      console.log('✅ Successfully accessed bank_users table!');
      console.log('👥 Found', data?.length || 0, 'users');
    }

    return { data, error };
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return { data: null, error: err };
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive refunds access tests...');

  const authResult = await testAuth();
  const bankUsersResult = await testBankUsersAccess();
  const refundsResult = await testRefundsAccess();

  console.log('📋 Test Summary:');
  console.log(
    '- Authentication:',
    authResult.user ? '✅ Authenticated' : '❌ Not authenticated'
  );
  console.log(
    '- Bank Users Access:',
    bankUsersResult.error ? '❌ Failed' : '✅ Success'
  );
  console.log(
    '- Refunds Access:',
    refundsResult.error ? '❌ Failed' : '✅ Success'
  );

  if (refundsResult.error) {
    console.log('🔧 Suggested fixes:');
    console.log('1. Run the SQL script: supabase/fix_refunds_admin_access.sql');
    console.log('2. Check RLS policies on refunds table');
    console.log('3. Verify user has admin role');
  }
}

// Auto-run tests
runAllTests();
