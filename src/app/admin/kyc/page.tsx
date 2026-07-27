'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supbaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type KycSubmission = {
  id: string;
  user_id: string;
  identification_type: string;
  identification_number: string;
  document_urls: string[];
  selfie_url: string;
  address: string;
  phone_number: string;
  proof_of_address_url: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  bank_users: {
    full_name: string;
    email: string;
  };
};

export default function AdminKycPage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    loadSubmissions();
  }, []);

  // Add test function to window for console testing
  useEffect(() => {
    (window as any).testAccountCreation = async (userId: string) => {
      console.log('🧪 TESTING ACCOUNT CREATION FOR USER:', userId);
      await createAccountsManually(userId);
    };

    (window as any).getAllUsers = async () => {
      const { data: users } = await supabase
        .from('bank_users')
        .select('id, email, full_name, kyc_status')
        .limit(5);
      console.log('👥 Available users:', users);
      return users;
    };

    console.log('🧪 Test functions available:');
    console.log('- testAccountCreation(userId)');
    console.log('- getAllUsers()');
  }, []);

  const loadSubmissions = async () => {
    const { data } = await supabase
      .from('kyc_submissions')
      .select('*, bank_users(full_name, email)')
      .order('submitted_at', { ascending: false });
    setSubmissions((data as KycSubmission[]) ?? []);
    setLoading(false);
  };

  const createAccountsManually = async (userId: string) => {
    if (!userId) {
      console.error('❌ No user ID provided for account creation');
      return;
    }

    try {
      console.log('🔧 MANUAL ACCOUNT CREATION STARTED');
      console.log('👤 User ID:', userId);
      console.log('⏰ Timestamp:', new Date().toISOString());

      // Generate unique account numbers
      const checkingAccountNumber = Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(10, '0');
      const savingsAccountNumber = Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(10, '0');
      const investmentAccountNumber = Math.floor(Math.random() * 10000000000)
        .toString()
        .padStart(10, '0');

      console.log('🔢 Generated account numbers:', {
        checking: checkingAccountNumber,
        savings: savingsAccountNumber,
        investment: investmentAccountNumber,
      });

      // Create checking account
      console.log('🏦 Creating checking account...');
      const checkingData = {
        user_id: userId,
        account_type: 'checking',
        account_number: checkingAccountNumber,
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
        console.error('❌ Checking account data was:', checkingData);
      } else {
        console.log(
          '✅ Checking account created successfully:',
          checkingAccount
        );
      }

      // Create savings account
      console.log('💰 Creating savings account...');
      const savingsData = {
        user_id: userId,
        account_type: 'savings',
        account_number: savingsAccountNumber,
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
        console.error('❌ Savings account data was:', savingsData);
      } else {
        console.log('✅ Savings account created successfully:', savingsAccount);
      }

      // Create investment account
      console.log('📈 Creating investment account...');
      const investmentData = {
        user_id: userId,
        account_type: 'investment',
        account_number: investmentAccountNumber,
        balance: 0,
      };

      console.log('📝 Investment account data:', investmentData);

      const { data: investmentAccount, error: investmentError } = await supabase
        .from('accounts')
        .insert(investmentData)
        .select()
        .single();

      if (investmentError) {
        console.error('❌ Error creating investment account:', investmentError);
        console.error('❌ Investment account data was:', investmentData);
      } else {
        console.log(
          '✅ Investment account created successfully:',
          investmentAccount
        );
      }

      // Update bank user status
      console.log('👤 Updating bank user status to approved...');
      const { error: statusError } = await supabase
        .from('bank_users')
        .update({ kyc_status: 'approved' })
        .eq('id', userId);

      if (statusError) {
        console.error('❌ Error updating bank user status:', statusError);
      } else {
        console.log('✅ Bank user status updated to approved');
      }

      // Final verification
      console.log('🔍 Final verification - checking all accounts for user...');
      const { data: finalAccounts, error: finalError } = await supabase
        .from('accounts')
        .select('id, account_type, account_number, balance')
        .eq('user_id', userId);

      if (finalError) {
        console.error('❌ Error in final verification:', finalError);
      } else {
        console.log('📊 Final account count:', finalAccounts?.length || 0);
        console.log('📋 Final accounts:', finalAccounts);

        if (finalAccounts && finalAccounts.length >= 2) {
          console.log('🎉 MANUAL ACCOUNT CREATION COMPLETED SUCCESSFULLY!');
          console.log('✅ User now has both checking and savings accounts');
        } else {
          console.warn(
            '⚠️ Manual creation may have failed - expected 2 accounts, found:',
            finalAccounts?.length || 0
          );
        }
      }
    } catch (error) {
      console.error('❌ CRITICAL ERROR in manual account creation:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: userId,
      });
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    console.log('🚀 ===== UPDATE STATUS FUNCTION CALLED =====');
    console.log(`📧 Updating KYC status to ${newStatus} for submission ${id}`);
    console.log('🔍 Current timestamp:', new Date().toISOString());
    console.log('🚀 ===== FUNCTION START =====');
    setUpdatingStatus(id);

    try {
      // Update the KYC submission status
      console.log('🔄 ========== UPDATING KYC SUBMISSION STATUS ==========');
      console.log('📝 Submission ID to update:', id);
      console.log('📝 ID type:', typeof id);
      console.log('📝 New status to set:', newStatus);
      console.log('📝 Status type:', typeof newStatus);
      console.log('📝 Current timestamp:', new Date().toISOString());

      const updateData = {
        status: newStatus,
        reviewed_at: new Date().toISOString(),
      };
      console.log('📝 Update data object:', updateData);

      console.log('🔄 Calling Supabase update...');
      const {
        data: updateResult,
        error,
        count,
      } = await supabase
        .from('kyc_submissions')
        .update(updateData)
        .eq('id', id)
        .select();

      console.log('✅ Supabase update call completed');
      console.log('📊 Update response:', { updateResult, error, count });

      if (error) {
        console.error('❌ ========== UPDATE FAILED WITH ERROR ==========');
        console.error('❌ Error object:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        console.error('❌ Error hint:', error.hint);
        console.error('❌ Error code:', error.code);
        console.error('❌ Full error JSON:', JSON.stringify(error, null, 2));
        console.error('❌ ========================================');
        return;
      }

      console.log('✅ No error returned from Supabase');
      console.log('📊 Checking update result...');
      console.log('📊 updateResult is null?', updateResult === null);
      console.log('📊 updateResult is undefined?', updateResult === undefined);
      console.log('📊 updateResult type:', typeof updateResult);
      console.log('📊 updateResult value:', updateResult);

      if (!updateResult || updateResult.length === 0) {
        console.error(
          '❌ ========== UPDATE FAILED - NO ROWS AFFECTED =========='
        );
        console.error('❌ updateResult:', updateResult);
        console.error('❌ updateResult length:', updateResult?.length);
        console.error('❌ Submission ID used:', id);
        console.error('❌ This could be due to:');
        console.error('   1. Invalid submission ID (no matching record)');
        console.error('   2. Submission was already updated');
        console.error('   3. Database connection issue');
        console.error('❌ ================================================');

        // Try to fetch the submission to see if it exists
        console.log('🔍 Checking if submission exists...');
        const { data: checkSubmission, error: checkError } = await supabase
          .from('kyc_submissions')
          .select('id, status, reviewed_at')
          .eq('id', id)
          .single();

        console.log('📊 Submission exists?', checkSubmission);
        console.log('📊 Check error?', checkError);
        return;
      }

      console.log('🎉 ========== UPDATE SUCCESSFUL ==========');
      console.log(`✅ KYC status updated to ${newStatus}`);
      console.log('📊 Update result:', updateResult);
      console.log('📊 Number of rows updated:', updateResult.length);
      console.log(
        '📊 Updated record:',
        JSON.stringify(updateResult[0], null, 2)
      );
      console.log('🎉 ====================================');

      // Verify the status was actually updated
      console.log('🔍 ========== VERIFYING STATUS UPDATE ==========');
      console.log('🔍 Fetching submission again to verify...');
      const { data: verifySubmission, error: verifyError } = await supabase
        .from('kyc_submissions')
        .select('id, status, reviewed_at')
        .eq('id', id)
        .single();

      if (verifyError) {
        console.error('❌ Error verifying status update:', verifyError);
      } else {
        console.log('✅ Verification fetch successful');
        console.log('📊 Verified submission:', verifySubmission);
        console.log('📊 Expected status:', newStatus);
        console.log('📊 Actual status:', verifySubmission?.status);
        console.log('📊 Status match?', verifySubmission?.status === newStatus);

        if (verifySubmission?.status === newStatus) {
          console.log('🎉 ========================================');
          console.log('🎉 STATUS SUCCESSFULLY UPDATED IN DATABASE!');
          console.log('🎉 ========================================');
        } else {
          console.warn('⚠️ ========================================');
          console.warn('⚠️ STATUS MISMATCH!');
          console.warn('⚠️ Expected:', newStatus);
          console.warn('⚠️ Got:', verifySubmission?.status);
          console.warn('⚠️ The update may have been overwritten or failed');
          console.warn('⚠️ ========================================');
        }
      }
      console.log('🔍 ====================================');

      // Get the submission details for email notification
      console.log('🔍 Fetching submission details for email...');
      const { data: submission, error: submissionError } = await supabase
        .from('kyc_submissions')
        .select('*, bank_users(full_name, email)')
        .eq('id', id)
        .single();

      if (submissionError) {
        console.error('❌ Error fetching submission details:', submissionError);
        return;
      }

      console.log('👤 Submission details:', {
        id: submission.id,
        user_id: submission.user_id,
        current_status: submission.status,
        user_email: submission.bank_users?.email,
        user_name: submission.bank_users?.full_name,
      });

      // Check if we should create accounts
      console.log('🔍 CHECKING IF SHOULD CREATE ACCOUNTS...');
      console.log('📝 newStatus value:', newStatus);
      console.log('📝 newStatus type:', typeof newStatus);
      console.log(
        '📝 Comparison result (newStatus === "approved"):',
        newStatus === 'approved'
      );

      // If approved, check for existing accounts first, then wait for trigger
      if (newStatus === 'approved') {
        console.log('✅ CONDITION MET - newStatus is approved');
        console.log('🎯 KYC APPROVED - Starting account creation process...');

        // Check if user already has accounts
        console.log('🔍 Checking for existing accounts...');
        const { data: existingAccounts, error: existingError } = await supabase
          .from('accounts')
          .select('id, account_type, account_number, balance')
          .eq('user_id', submission.user_id);

        if (existingError) {
          console.error('❌ Error checking existing accounts:', existingError);
        } else {
          console.log(
            '📊 Existing accounts found:',
            existingAccounts?.length || 0
          );
          if (existingAccounts && existingAccounts.length > 0) {
            console.log('📋 Existing accounts:', existingAccounts);
          }
        }

        // Wait for database trigger to create accounts
        console.log('⏳ Waiting for database trigger to create accounts...');
        console.log('🔄 Waiting 2 seconds for trigger execution...');
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check accounts after trigger
        console.log('🔍 Checking accounts after trigger execution...');
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select('id, account_type, account_number, balance')
          .eq('user_id', submission.user_id);

        if (accountsError) {
          console.error('❌ Error checking created accounts:', accountsError);
        } else {
          console.log(
            '📊 Accounts found after trigger:',
            accounts?.length || 0
          );
          console.log('📋 Account details:', accounts);

          if (accounts && accounts.length >= 2) {
            console.log(
              '✅ Both checking and savings accounts created successfully by trigger'
            );
            console.log('🎉 Account creation process completed successfully!');
          } else {
            console.warn(
              '⚠️ Expected 2 accounts, found:',
              accounts?.length || 0
            );
            console.log(
              '🔧 Database trigger may have failed, attempting manual creation...'
            );
            await createAccountsManually(submission.user_id);
          }
        }
      }

      console.log('📧 REACHED EMAIL SECTION');
      console.log('📧 submission exists:', !!submission);
      console.log('📧 submission.bank_users exists:', !!submission?.bank_users);

      if (submission && submission.bank_users) {
        console.log(
          `📧 Sending ${newStatus} email to user:`,
          submission.bank_users.email
        );

        try {
          // Send appropriate email based on status
          console.log('📧 About to send email, newStatus is:', newStatus);
          if (newStatus === 'approved') {
            console.log('📧 Sending APPROVED email...');
            await fetch('/api/emails/kyc-approved', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: submission.bank_users.email,
                userName: submission.bank_users.full_name,
              }),
            });
            console.log('✅ KYC approved email sent');
          } else if (newStatus === 'rejected') {
            await fetch('/api/emails/kyc-rejected', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: submission.bank_users.email,
                userName: submission.bank_users.full_name,
                reason: 'Documents did not meet verification requirements', // You can make this configurable
              }),
            });
            console.log('✅ KYC rejected email sent');
          }
        } catch (emailError) {
          console.error('Failed to send KYC status email:', emailError);
          // Don't fail the status update if email fails
        }
      }

      // Reload submissions to show updated status
      loadSubmissions();
    } catch (err) {
      console.error('Error in updateStatus:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <Badge className="mb-4">Admin</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        KYC Submissions
      </h1>
      <p className="mt-2 text-muted-foreground">
        Review and approve/reject identity verification requests.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6">
        {submissions.map((sub) => (
          <Card key={sub.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {sub.bank_users.full_name} ({sub.bank_users.email})
              </CardTitle>
              <CardDescription>
                <Badge
                  variant={
                    sub.status === 'pending'
                      ? 'secondary'
                      : sub.status === 'approved'
                      ? 'default'
                      : 'destructive'
                  }
                >
                  {sub.status}
                </Badge>{' '}
                • Submitted {new Date(sub.submitted_at).toLocaleString()}
                {sub.reviewed_at &&
                  ` • Reviewed ${new Date(sub.reviewed_at).toLocaleString()}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Identity Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">ID Type:</span>{' '}
                  {sub.identification_type.toUpperCase()}
                </div>
                <div>
                  <span className="font-medium">ID Number:</span>{' '}
                  {sub.identification_number}
                </div>
                <div className="md:col-span-2">
                  <span className="font-medium">Address:</span> {sub.address}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {sub.phone_number}
                </div>
              </div>

              <Separator />

              {/* Documents */}
              <div className="space-y-3">
                <div className="font-medium text-sm">Uploaded documents:</div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Identity docs ({sub.document_urls.length}):
                    </span>
                    <div className="mt-1 space-y-1">
                      {sub.document_urls.map((url, idx) => (
                        <div key={idx}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-xs"
                          >
                            Document {idx + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Selfie:</span>{' '}
                    <a
                      href={sub.selfie_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      View selfie
                    </a>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      Proof of address:
                    </span>{' '}
                    <a
                      href={sub.proof_of_address_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-xs"
                    >
                      View document
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              {sub.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    onClick={() => {
                      console.log('🖱️ APPROVE BUTTON CLICKED!');
                      console.log('🖱️ Submission ID:', sub.id);
                      console.log('🖱️ Calling updateStatus function...');
                      updateStatus(sub.id, 'approved');
                    }}
                    disabled={updatingStatus === sub.id}
                  >
                    {updatingStatus === sub.id ? 'Processing...' : 'Approve'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateStatus(sub.id, 'rejected')}
                    disabled={updatingStatus === sub.id}
                  >
                    {updatingStatus === sub.id ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {submissions.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No KYC submissions yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
