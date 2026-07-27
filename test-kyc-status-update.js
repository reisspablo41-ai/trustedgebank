// Test script to verify KYC status update
// Run this in the browser console on the admin KYC page

console.log('🧪 TESTING KYC STATUS UPDATE');
console.log('============================');

// Test function to update KYC status
async function testKycStatusUpdate(submissionId, newStatus) {
  try {
    console.log('🔧 Testing KYC status update...');
    console.log('📝 Submission ID:', submissionId);
    console.log('📝 New Status:', newStatus);

    // First, check current status
    console.log('🔍 Step 1: Checking current status...');
    const { data: currentSubmission, error: currentError } = await supabase
      .from('kyc_submissions')
      .select('id, status, reviewed_at')
      .eq('id', submissionId)
      .single();

    if (currentError) {
      console.error('❌ Error fetching current submission:', currentError);
      return;
    }

    console.log('📊 Current status:', currentSubmission);

    // Update the status
    console.log('🔄 Step 2: Updating status...');
    const { data: updateResult, error: updateError } = await supabase
      .from('kyc_submissions')
      .update({
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', submissionId)
      .select();

    if (updateError) {
      console.error('❌ Error updating status:', updateError);
      console.error('❌ Full error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      });
      return;
    }

    console.log('✅ Update result:', updateResult);

    // Verify the update
    console.log('🔍 Step 3: Verifying update...');
    const { data: verifySubmission, error: verifyError } = await supabase
      .from('kyc_submissions')
      .select('id, status, reviewed_at')
      .eq('id', submissionId)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('📊 Verification result:', verifySubmission);
      if (verifySubmission?.status === newStatus) {
        console.log('🎉 STATUS UPDATE SUCCESSFUL!');
        console.log(
          '✅ Status changed from',
          currentSubmission?.status,
          'to',
          verifySubmission?.status
        );
      } else {
        console.warn(
          '⚠️ Status update failed - expected:',
          newStatus,
          'got:',
          verifySubmission?.status
        );
      }
    }
  } catch (error) {
    console.error('❌ CRITICAL ERROR in test:', error);
  }
}

// Function to get a pending KYC submission for testing
async function getPendingKycSubmission() {
  try {
    console.log('🔍 Finding a pending KYC submission...');

    const { data: submissions, error } = await supabase
      .from('kyc_submissions')
      .select('id, status, submitted_at, bank_users(email, full_name)')
      .eq('status', 'pending')
      .limit(1);

    if (error) {
      console.error('❌ Error fetching submissions:', error);
      return null;
    }

    if (submissions && submissions.length > 0) {
      console.log('📋 Found pending submission:', submissions[0]);
      return submissions[0];
    } else {
      console.log('⚠️ No pending submissions found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error in getPendingKycSubmission:', error);
    return null;
  }
}

// Auto-run test
console.log('🚀 Starting automatic test...');
getPendingKycSubmission().then((submission) => {
  if (submission) {
    console.log('🧪 Running status update test...');
    testKycStatusUpdate(submission.id, 'approved');
  } else {
    console.log('❌ No pending submission available for testing');
    console.log(
      '💡 Try creating a KYC submission first, or test with an existing submission ID'
    );
  }
});

// Export functions for manual testing
window.testKycStatusUpdate = testKycStatusUpdate;
window.getPendingKycSubmission = getPendingKycSubmission;

console.log('🧪 Test functions available:');
console.log('- testKycStatusUpdate(submissionId, newStatus)');
console.log('- getPendingKycSubmission()');
console.log('============================');
