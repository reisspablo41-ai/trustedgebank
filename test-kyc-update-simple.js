// Simple test to update KYC submission status
// Run this in browser console

console.log('🧪 SIMPLE KYC STATUS UPDATE TEST');
console.log('=================================');

async function testSimpleUpdate(submissionId, newStatus) {
  console.log('📝 Testing update for submission:', submissionId);
  console.log('📝 New status:', newStatus);

  try {
    // Step 1: Check current status
    console.log('\n🔍 Step 1: Checking current status...');
    const { data: before, error: beforeError } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (beforeError) {
      console.error('❌ Error fetching submission:', beforeError);
      return;
    }

    console.log('📊 Current submission:', before);
    console.log('📊 Current status:', before.status);

    // Step 2: Update status
    console.log('\n🔄 Step 2: Updating status...');
    const { data: updateResult, error: updateError } = await supabase
      .from('kyc_submissions')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      console.error('❌ Error details:', JSON.stringify(updateError, null, 2));
      return;
    }

    console.log('✅ Update result:', updateResult);
    console.log('📊 Rows affected:', updateResult?.length || 0);

    // Step 3: Verify update
    console.log('\n🔍 Step 3: Verifying update...');
    const { data: after, error: afterError } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (afterError) {
      console.error('❌ Error verifying:', afterError);
      return;
    }

    console.log('📊 After update:', after);
    console.log('📊 New status:', after.status);

    // Compare
    console.log('\n📊 COMPARISON:');
    console.log('   Before:', before.status);
    console.log('   After:', after.status);
    console.log('   Expected:', newStatus);
    console.log('   Success?', after.status === newStatus);

    if (after.status === newStatus) {
      console.log('\n🎉 TEST PASSED!');
    } else {
      console.warn('\n⚠️ TEST FAILED - Status not updated');
    }
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
  }
}

// Get first pending submission
async function getFirstPending() {
  const { data, error } = await supabase
    .from('kyc_submissions')
    .select('id, status, bank_users(email)')
    .eq('status', 'pending')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error finding pending submission:', error);
    return null;
  }

  console.log('📋 Found pending submission:', data);
  return data;
}

// Auto-run
console.log('🚀 Auto-running test...\n');
getFirstPending().then((submission) => {
  if (submission) {
    testSimpleUpdate(submission.id, 'approved');
  } else {
    console.log('⚠️ No pending submissions found');
    console.log('💡 Use: testSimpleUpdate("submission-id", "approved")');
  }
});

// Export for manual use
window.testSimpleUpdate = testSimpleUpdate;
window.getFirstPending = getFirstPending;

console.log('\n📋 Functions available:');
console.log('- testSimpleUpdate(submissionId, status)');
console.log('- getFirstPending()');
console.log('=================================');
