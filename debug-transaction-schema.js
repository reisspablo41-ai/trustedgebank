// Debug script to test transaction schema
// Run this in browser console to test transaction creation

async function testTransactionSchema() {
  console.log('🔍 Testing transaction schema...');

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('❌ Not authenticated:', authError);
    return;
  }

  console.log('✅ User authenticated:', user.id);

  // Get user's accounts
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id);

  if (accountsError || !accounts || accounts.length === 0) {
    console.error('❌ No accounts found:', accountsError);
    return;
  }

  console.log('✅ Accounts found:', accounts);

  // Test transaction data
  const testTransactionData = {
    user_id: user.id,
    account_id: accounts[0].id,
    transaction_type: 'payment',
    direction: 'debit',
    amount: 1.0,
    currency: 'USD',
    status: 'posted',
    description: 'Test transaction',
    reference: `TEST-${Date.now()}`,
    balance_after: accounts[0].balance - 1.0,
    metadata: {
      test: true,
      timestamp: new Date().toISOString(),
    },
  };

  console.log('🔍 Test transaction data:', testTransactionData);

  // Try to insert
  const { data: insertData, error: insertError } = await supabase
    .from('transactions')
    .insert(testTransactionData);

  if (insertError) {
    console.error('❌ Transaction insert failed:', insertError);
    console.error('❌ Error code:', insertError.code);
    console.error('❌ Error message:', insertError.message);
    console.error('❌ Error details:', insertError.details);
    console.error('❌ Error hint:', insertError.hint);
    console.error('❌ Full error:', JSON.stringify(insertError, null, 2));
  } else {
    console.log('✅ Transaction inserted successfully:', insertData);
  }
}

// Run the test
testTransactionSchema();
