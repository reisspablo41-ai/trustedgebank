// Simple test script to create accounts for a user
// Run this in the browser console on any page

console.log('🧪 ACCOUNT CREATION TEST SCRIPT');
console.log('================================');

// Test function to create accounts for a specific user
async function testCreateAccounts(userId) {
  console.log('🔧 Testing account creation for user:', userId);
  console.log('⏰ Test started at:', new Date().toISOString());

  try {
    // Check existing accounts first
    console.log('🔍 Step 1: Checking existing accounts...');
    const { data: existingAccounts, error: checkError } = await supabase
      .from('accounts')
      .select('id, account_type, account_number, balance')
      .eq('user_id', userId);

    if (checkError) {
      console.error('❌ Error checking existing accounts:', checkError);
      return;
    }

    console.log('📊 Existing accounts found:', existingAccounts?.length || 0);
    if (existingAccounts && existingAccounts.length > 0) {
      console.log('📋 Existing accounts:', existingAccounts);
    }

    // Generate account numbers
    const checkingNumber = Math.floor(Math.random() * 10000000000)
      .toString()
      .padStart(10, '0');
    const savingsNumber = Math.floor(Math.random() * 10000000000)
      .toString()
      .padStart(10, '0');

    console.log('🔢 Generated account numbers:', {
      checking: checkingNumber,
      savings: savingsNumber,
    });

    // Create checking account
    console.log('🏦 Step 2: Creating checking account...');
    const checkingData = {
      user_id: userId,
      account_type: 'checking',
      account_number: checkingNumber,
      balance: 0,
    };

    console.log('📝 Checking account data:', checkingData);

    const { data: checkingAccount, error: checkingError } = await supabase
      .from('accounts')
      .insert(checkingData)
      .select()
      .single();

    if (checkingError) {
      console.error('❌ Error creating checking account:', checkingError);
      console.error('❌ Full error details:', {
        message: checkingError.message,
        details: checkingError.details,
        hint: checkingError.hint,
        code: checkingError.code,
      });
    } else {
      console.log('✅ Checking account created successfully:', checkingAccount);
    }

    // Create savings account
    console.log('💰 Step 3: Creating savings account...');
    const savingsData = {
      user_id: userId,
      account_type: 'savings',
      account_number: savingsNumber,
      balance: 0,
    };

    console.log('📝 Savings account data:', savingsData);

    const { data: savingsAccount, error: savingsError } = await supabase
      .from('accounts')
      .insert(savingsData)
      .select()
      .single();

    if (savingsError) {
      console.error('❌ Error creating savings account:', savingsError);
      console.error('❌ Full error details:', {
        message: savingsError.message,
        details: savingsError.details,
        hint: savingsError.hint,
        code: savingsError.code,
      });
    } else {
      console.log('✅ Savings account created successfully:', savingsAccount);
    }

    // Final verification
    console.log('🔍 Step 4: Final verification...');
    const { data: allAccounts, error: verifyError } = await supabase
      .from('accounts')
      .select('id, account_type, account_number, balance')
      .eq('user_id', userId);

    if (verifyError) {
      console.error('❌ Error in final verification:', verifyError);
    } else {
      console.log('📊 Final account count:', allAccounts?.length || 0);
      console.log('📋 All accounts for user:', allAccounts);

      if (allAccounts && allAccounts.length >= 2) {
        console.log('🎉 TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ User now has both checking and savings accounts');
      } else {
        console.warn(
          '⚠️ Test may have failed - expected 2 accounts, found:',
          allAccounts?.length || 0
        );
      }
    }
  } catch (error) {
    console.error('❌ CRITICAL ERROR in test:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      userId: userId,
    });
  }
}

// Function to get a user ID for testing
async function getTestUserId() {
  console.log('🔍 Finding a user ID for testing...');

  try {
    const { data: users, error } = await supabase
      .from('bank_users')
      .select('id, email, full_name')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching users:', error);
      return null;
    }

    if (users && users.length > 0) {
      console.log('👤 Found user for testing:', users[0]);
      return users[0].id;
    } else {
      console.log('⚠️ No users found in bank_users table');
      return null;
    }
  } catch (error) {
    console.error('❌ Error in getTestUserId:', error);
    return null;
  }
}

// Auto-run test
console.log('🚀 Starting automatic test...');
getTestUserId().then((userId) => {
  if (userId) {
    console.log('🧪 Running test with user ID:', userId);
    testCreateAccounts(userId);
  } else {
    console.log('❌ No user ID available for testing');
  }
});

// Export functions for manual testing
window.testCreateAccounts = testCreateAccounts;
window.getTestUserId = getTestUserId;

console.log('🧪 Test functions available:');
console.log('- testCreateAccounts(userId)');
console.log('- getTestUserId()');
console.log('================================');
