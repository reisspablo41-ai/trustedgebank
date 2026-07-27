// Test script to verify account creation works
// Run this in the browser console on the admin KYC page

console.log('🧪 Testing account creation for KYC approved users...');

// Test function to create accounts for a specific user
async function testAccountCreation(userId) {
  try {
    console.log('🔧 Testing account creation for user:', userId);

    // Check if user already has accounts
    const { data: existingAccounts, error: checkError } = await supabase
      .from('accounts')
      .select('id, account_type, account_number, balance')
      .eq('user_id', userId);

    if (checkError) {
      console.error('❌ Error checking existing accounts:', checkError);
      return;
    }

    console.log('📊 Existing accounts:', existingAccounts);

    if (existingAccounts && existingAccounts.length >= 2) {
      console.log('✅ User already has accounts:', existingAccounts.length);
      return existingAccounts;
    }

    // Create checking account
    console.log('🔧 Creating checking account...');
    const { data: checkingAccount, error: checkingError } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        account_type: 'checking',
        account_number: Math.floor(Math.random() * 10000000000)
          .toString()
          .padStart(10, '0'),
        balance: 0,
      })
      .select()
      .single();

    if (checkingError) {
      console.error('❌ Error creating checking account:', checkingError);
    } else {
      console.log('✅ Checking account created:', checkingAccount);
    }

    // Create savings account
    console.log('🔧 Creating savings account...');
    const { data: savingsAccount, error: savingsError } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        account_type: 'savings',
        account_number: Math.floor(Math.random() * 10000000000)
          .toString()
          .padStart(10, '0'),
        balance: 0,
      })
      .select()
      .single();

    if (savingsError) {
      console.error('❌ Error creating savings account:', savingsError);
    } else {
      console.log('✅ Savings account created:', savingsAccount);
    }

    // Verify accounts were created
    const { data: allAccounts, error: verifyError } = await supabase
      .from('accounts')
      .select('id, account_type, account_number, balance')
      .eq('user_id', userId);

    if (verifyError) {
      console.error('❌ Error verifying accounts:', verifyError);
    } else {
      console.log('📊 All accounts for user:', allAccounts);
      console.log('✅ Account creation test completed successfully');
    }

    return allAccounts;
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Test function to check all approved users without accounts
async function checkApprovedUsersWithoutAccounts() {
  try {
    console.log('🔍 Checking for approved users without accounts...');

    // Get all approved users
    const { data: approvedUsers, error: usersError } = await supabase
      .from('bank_users')
      .select('id, email, full_name, kyc_status')
      .eq('kyc_status', 'approved');

    if (usersError) {
      console.error('❌ Error fetching approved users:', usersError);
      return;
    }

    console.log('👥 Approved users:', approvedUsers);

    // Check which users don't have accounts
    const usersWithoutAccounts = [];

    for (const user of approvedUsers) {
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, account_type')
        .eq('user_id', user.id);

      if (accountsError) {
        console.error(
          `❌ Error checking accounts for user ${user.email}:`,
          accountsError
        );
        continue;
      }

      if (!accounts || accounts.length < 2) {
        usersWithoutAccounts.push({
          ...user,
          accountCount: accounts?.length || 0,
        });
      }
    }

    console.log('⚠️ Users without proper accounts:', usersWithoutAccounts);

    if (usersWithoutAccounts.length > 0) {
      console.log('🔧 Run this to create accounts for these users:');
      console.log(
        'usersWithoutAccounts.forEach(user => testAccountCreation(user.id));'
      );
    } else {
      console.log('✅ All approved users have proper accounts');
    }

    return usersWithoutAccounts;
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Auto-run the check
checkApprovedUsersWithoutAccounts();

// Export functions for manual testing
window.testAccountCreation = testAccountCreation;
window.checkApprovedUsersWithoutAccounts = checkApprovedUsersWithoutAccounts;

console.log('🧪 Test functions available:');
console.log('- testAccountCreation(userId)');
console.log('- checkApprovedUsersWithoutAccounts()');
