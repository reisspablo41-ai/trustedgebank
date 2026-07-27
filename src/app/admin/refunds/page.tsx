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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/simple-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, CheckCircle, XCircle, Clock, Plus, Eye } from 'lucide-react';

type Refund = {
  id: string;
  user_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  reason: string;
  reason_notes: string;
  idempotency_key: string;
  external_ref: string;
  processor: string;
  failure_reason: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
};

type RefundEvent = {
  id: string;
  refund_id: string;
  event_type: string;
  actor: string;
  message: string;
  created_at: string;
};

export default function AdminRefundsPage() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processing, setProcessing] = useState<string | null>(null);

  // Create refund modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('customer_request');
  const [reasonNotes, setReasonNotes] = useState('');
  const [initialStatus, setInitialStatus] = useState('pending');
  const [creating, setCreating] = useState(false);

  // Edit status modal
  const [editingRefund, setEditingRefund] = useState<Refund | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Edit amount modal
  const [editingAmount, setEditingAmount] = useState<Refund | null>(null);
  const [newAmount, setNewAmount] = useState('');
  const [updatingAmount, setUpdatingAmount] = useState(false);

  // Details modal
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [events, setEvents] = useState<RefundEvent[]>([]);

  // Users for dropdown
  const [users, setUsers] = useState<
    { id: string; email: string; full_name: string }[]
  >([]);

  useEffect(() => {
    loadRefunds();
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, refunds]);

  const loadUsers = async () => {
    const { data } = await supabase
      .from('bank_users')
      .select('id, email, full_name')
      .eq('kyc_status', 'approved')
      .order('full_name', { ascending: true });

    setUsers(data || []);
  };

  const loadRefunds = async () => {
    try {
      console.log('🔍 [ADMIN REFUNDS] Loading refunds...');

      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('🔍 [ADMIN REFUNDS] Query result:', { data, error });

      if (error) {
        console.error('❌ [ADMIN REFUNDS] Error loading refunds:', error);
        console.error('❌ [ADMIN REFUNDS] Error code:', error.code);
        console.error('❌ [ADMIN REFUNDS] Error message:', error.message);
        console.error('❌ [ADMIN REFUNDS] Error details:', error.details);
        console.error('❌ [ADMIN REFUNDS] Error hint:', error.hint);
        console.error(
          '❌ [ADMIN REFUNDS] Full error object:',
          JSON.stringify(error, null, 2)
        );

        toast({
          title: 'Error',
          description: `Failed to load refunds: ${
            error.message || 'Unknown error'
          }`,
          variant: 'destructive',
        });
      } else {
        console.log(
          '✅ [ADMIN REFUNDS] Refunds loaded successfully:',
          data?.length || 0,
          'refunds'
        );
        // Fetch user details
        console.log(
          '🔍 [ADMIN REFUNDS] Fetching user details for',
          data?.length || 0,
          'refunds'
        );
        const refundsWithUsers = await Promise.all(
          (data || []).map(async (refund) => {
            console.log(
              '🔍 [ADMIN REFUNDS] Fetching user data for refund:',
              refund.id,
              'user_id:',
              refund.user_id
            );

            const { data: userData, error: userError } = await supabase
              .from('bank_users')
              .select('email, full_name')
              .eq('id', refund.user_id)
              .single();

            if (userError) {
              console.error(
                '❌ [ADMIN REFUNDS] Error fetching user data for refund',
                refund.id,
                ':',
                userError
              );
            } else {
              console.log(
                '✅ [ADMIN REFUNDS] User data fetched for refund',
                refund.id,
                ':',
                userData
              );
            }

            return {
              ...refund,
              user_email: userData?.email,
              user_name: userData?.full_name,
            };
          })
        );

        setRefunds(refundsWithUsers);
        setFilteredRefunds(refundsWithUsers);
      }
    } catch (err) {
      console.error('❌ [ADMIN REFUNDS] Unexpected error:', err);
      console.error(
        '❌ [ADMIN REFUNDS] Error details:',
        JSON.stringify(err, null, 2)
      );
      toast({
        title: 'Error',
        description: `Failed to load refunds: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`,
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const filterRefunds = () => {
    let filtered = refunds;

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.external_ref?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    setFilteredRefunds(filtered);
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId || !amount) {
      toast({
        title: 'Validation error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid amount.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const idempotencyKey = `admin-create-${Date.now()}-${selectedUserId}`;

      const refundData = {
        user_id: selectedUserId,
        amount_cents: Math.round(amountValue * 100),
        currency: 'USD',
        status: initialStatus,
        reason,
        reason_notes: reasonNotes || null,
        idempotency_key: idempotencyKey,
        external_ref: `REF-${Date.now().toString().slice(-8)}`,
        processor: 'admin',
        failure_reason: null,
        metadata: {},
      };

      console.log('Creating refund with data:', refundData);

      const { data: newRefund, error } = await supabase
        .from('refunds')
        .insert(refundData)
        .select()
        .single();

      console.log('Refund creation result:', { newRefund, error });

      if (error) {
        console.error('Error creating refund:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast({
          title: 'Error creating refund',
          description:
            error.message ||
            'Failed to create refund. Check console for details.',
          variant: 'destructive',
        });
        setCreating(false);
        return;
      }

      if (newRefund) {
        // Log event
        await supabase.from('refund_events').insert({
          refund_id: newRefund.id,
          event_type: 'created',
          actor: user?.email || 'admin',
          message: `Refund created by admin for $${amountValue.toFixed(
            2
          )} with status: ${initialStatus}`,
          payload: {
            amount_cents: newRefund.amount_cents,
            reason,
            status: initialStatus,
          },
        });

        // Create idempotency record
        await supabase.from('refunds_idempotency').insert({
          idempotency_key: idempotencyKey,
          user_id: selectedUserId,
          refund_id: newRefund.id,
        });

        // Create alert for user
        const alertMessage =
          initialStatus === 'approved'
            ? `You have a refund of $${amountValue.toFixed(
                2
              )} ready. It has been added to your checking account balance.`
            : `A refund of $${amountValue.toFixed(
                2
              )} has been created for your account. Status: ${initialStatus}`;

        const { error: alertError } = await supabase.from('alerts').insert({
          user_id: selectedUserId,
          type: 'general',
          title:
            initialStatus === 'approved'
              ? 'Refund approved and ready'
              : 'Refund created',
          message: alertMessage,
          severity: initialStatus === 'approved' ? 'success' : 'info',
          is_read: false,
        });

        if (alertError) {
          console.error('Error creating alert:', alertError);
        } else {
          console.log('✅ Alert created for user:', selectedUserId);
        }

        // Send email notification to user
        console.log('📧 Starting email notification process...');
        try {
          console.log('📧 Fetching user data for ID:', selectedUserId);
          const { data: userData } = await supabase
            .from('bank_users')
            .select('email, full_name')
            .eq('id', selectedUserId)
            .single();

          console.log('📧 User data retrieved:', userData);

          if (userData) {
            const emailPayload = {
              email: userData.email,
              userName: userData.full_name,
              amount: amountValue,
              reason: reason,
              refundId: newRefund.external_ref || newRefund.id.slice(0, 8),
            };

            console.log('📧 Sending email with payload:', emailPayload);
            console.log('📧 Calling /api/emails/refund-created...');

            const emailResponse = await fetch('/api/emails/refund-created', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(emailPayload),
            });

            console.log('📧 Email API response status:', emailResponse.status);
            console.log('📧 Email API response ok:', emailResponse.ok);

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error('📧 Email API error response:', errorText);
            } else {
              const responseData = await emailResponse.json();
              console.log('📧 Email API success response:', responseData);
            }

            console.log('✅ Refund creation email sent to:', userData.email);
          } else {
            console.error('📧 No user data found for ID:', selectedUserId);
          }
        } catch (emailError) {
          console.error('❌ Failed to send refund creation email:', emailError);
          console.error(
            '❌ Email error details:',
            JSON.stringify(emailError, null, 2)
          );
        }

        // Update balance based on status
        const { data: checkingAccount } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', selectedUserId)
          .eq('account_type', 'checking')
          .single();

        if (checkingAccount) {
          if (initialStatus === 'approved') {
            // Approved: Add to checking balance immediately
            const newBalance = checkingAccount.balance + amountValue;

            const { error: balanceError } = await supabase
              .from('accounts')
              .update({ balance: newBalance })
              .eq('id', checkingAccount.id);

            if (balanceError) {
              console.error('Error updating balance:', balanceError);
            } else {
              console.log(
                `Added to checking balance: $${checkingAccount.balance} + $${amountValue} = $${newBalance}`
              );

              // Create transaction record
              await supabase.from('transactions').insert({
                user_id: selectedUserId,
                account_id: checkingAccount.id,
                transaction_type: 'refund',
                direction: 'credit',
                amount: amountValue,
                currency: 'USD',
                status: 'posted',
                description: `Refund: ${
                  reasonNotes || reason || 'Approved refund'
                }`,
                reference: `REF-${Date.now().toString().slice(-8)}`,
              });
            }
          }
        }

        toast({
          title: 'Refund created',
          description: `Refund of $${amountValue.toFixed(
            2
          )} created successfully. User has been notified and pending balance updated.`,
        });

        setShowCreateModal(false);
        setSelectedUserId('');
        setAmount('');
        setReason('customer_request');
        setReasonNotes('');
        setInitialStatus('pending');
        await loadRefunds();
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: 'Failed to create refund.',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (refund: Refund) => {
    setProcessing(refund.id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('refunds')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString(),
        })
        .eq('id', refund.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Log event
        await supabase.from('refund_events').insert({
          refund_id: refund.id,
          event_type: 'approved',
          actor: user?.email || 'admin',
          message: `Refund approved by admin`,
        });

        // Send alert to user
        await supabase.from('alerts').insert({
          user_id: refund.user_id,
          type: 'general',
          title: 'Refund approved',
          message: `Your refund of $${(refund.amount_cents / 100).toFixed(
            2
          )} has been approved. You can now withdraw it to your account.`,
          severity: 'success',
          is_read: false,
        });

        // Send email notification to user
        try {
          const { data: userData } = await supabase
            .from('bank_users')
            .select('email, full_name')
            .eq('id', refund.user_id)
            .single();

          if (userData) {
            await fetch('/api/emails/refund-approved', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userData.email,
                userName: userData.full_name,
                amount: refund.amount_cents / 100,
                refundId: refund.external_ref || refund.id.slice(0, 8),
              }),
            });
            console.log('✅ Refund approved email sent to:', userData.email);
          }
        } catch (emailError) {
          console.error('Failed to send refund approved email:', emailError);
        }

        toast({
          title: 'Refund approved',
          description: 'User has been notified.',
        });

        await loadRefunds();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (refund: Refund) => {
    setProcessing(refund.id);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('refunds')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', refund.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Log event
        await supabase.from('refund_events').insert({
          refund_id: refund.id,
          event_type: 'cancelled',
          actor: user?.email || 'admin',
          message: `Refund cancelled by admin`,
        });

        // Send alert to user
        await supabase.from('alerts').insert({
          user_id: refund.user_id,
          type: 'general',
          title: 'Refund cancelled',
          message: `Your refund request of $${(
            refund.amount_cents / 100
          ).toFixed(2)} has been cancelled.`,
          severity: 'error',
          is_read: false,
        });

        toast({
          title: 'Refund cancelled',
          description: 'User has been notified.',
        });

        await loadRefunds();
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setProcessing(null);
    }
  };

  const handleEditStatus = (refund: Refund) => {
    setEditingRefund(refund);
    setNewStatus(refund.status);
  };

  const handleEditAmount = (refund: Refund) => {
    setEditingAmount(refund);
    setNewAmount((refund.amount_cents / 100).toString());
  };

  const handleUpdateAmount = async () => {
    if (!editingAmount || !newAmount) return;

    setUpdatingAmount(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const newAmountCents = Math.round(parseFloat(newAmount) * 100);

      const { error } = await supabase
        .from('refunds')
        .update({
          amount_cents: newAmountCents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingAmount.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Log event
        await supabase.from('refund_events').insert({
          refund_id: editingAmount.id,
          event_type: 'amount_updated',
          actor: user?.email || 'admin',
          message: `Amount updated from $${(
            editingAmount.amount_cents / 100
          ).toFixed(2)} to $${parseFloat(newAmount).toFixed(2)} by admin`,
        });

        toast({
          title: 'Amount updated',
          description: `Refund amount updated to $${parseFloat(
            newAmount
          ).toFixed(2)}.`,
        });

        setEditingAmount(null);
        setNewAmount('');
        await loadRefunds();
      }
    } catch (err) {
      console.error('Error updating amount:', err);
      toast({
        title: 'Error',
        description: 'Failed to update amount.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingAmount(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingRefund || !newStatus) return;

    setUpdating(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('refunds')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRefund.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        // Log event
        await supabase.from('refund_events').insert({
          refund_id: editingRefund.id,
          event_type: 'status_changed',
          actor: user?.email || 'admin',
          message: `Status changed from ${editingRefund.status} to ${newStatus} by admin`,
        });

        // Send alert to user
        const statusMessages: Record<string, string> = {
          pending: 'Your refund is now pending review.',
          approved: 'Your refund has been approved and is ready to withdraw!',
          completed: 'Your refund has been completed.',
          failed: 'Your refund has failed. Please contact support.',
          cancelled: 'Your refund has been cancelled.',
        };

        await supabase.from('alerts').insert({
          user_id: editingRefund.user_id,
          type: 'general',
          title: `Refund status updated`,
          message: `Your refund of $${(
            editingRefund.amount_cents / 100
          ).toFixed(2)} - ${statusMessages[newStatus]}`,
          severity:
            newStatus === 'approved' || newStatus === 'completed'
              ? 'success'
              : newStatus === 'failed' || newStatus === 'cancelled'
              ? 'error'
              : 'info',
          is_read: false,
        });

        // Send email notification to user
        try {
          const { data: userData } = await supabase
            .from('bank_users')
            .select('email, full_name')
            .eq('id', editingRefund.user_id)
            .single();

          if (userData) {
            await fetch('/api/emails/refund-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userData.email,
                userName: userData.full_name,
                amount: editingRefund.amount_cents / 100,
                status: newStatus,
                refundId: editingRefund.id,
              }),
            });
          }
        } catch (emailError) {
          console.error('Failed to send refund status email:', emailError);
        }

        // If status is completed, add the refund amount to user's checking account
        if (newStatus === 'completed') {
          try {
            console.log(
              '💰 Processing completed refund - adding to checking account'
            );

            // Get user's checking account
            const { data: checkingAccount } = await supabase
              .from('accounts')
              .select('*')
              .eq('user_id', editingRefund.user_id)
              .eq('account_type', 'checking')
              .single();

            if (checkingAccount) {
              const refundAmount = editingRefund.amount_cents / 100;
              const newBalance = checkingAccount.balance + refundAmount;

              // Update account balance
              const { error: balanceError } = await supabase
                .from('accounts')
                .update({ balance: newBalance })
                .eq('id', checkingAccount.id);

              if (balanceError) {
                console.error('Error updating account balance:', balanceError);
              } else {
                console.log('✅ Account balance updated:', newBalance);

                // Create transaction record
                const transactionData = {
                  user_id: editingRefund.user_id,
                  account_id: checkingAccount.id,
                  transaction_type: 'refund',
                  direction: 'credit',
                  amount: refundAmount,
                  currency: 'USD',
                  status: 'posted',
                  description: `Refund completed - ${
                    editingRefund.reason
                  } (Ref: ${
                    editingRefund.external_ref || editingRefund.id.slice(0, 8)
                  })`,
                  reference: `REF-${Date.now().toString().slice(-8)}`,
                };

                console.log(
                  '📝 Creating transaction record with data:',
                  transactionData
                );

                const { error: txnError } = await supabase
                  .from('transactions')
                  .insert(transactionData);

                if (txnError) {
                  console.error(
                    '❌ Error creating transaction record:',
                    txnError
                  );
                  console.error('❌ Transaction data was:', transactionData);
                } else {
                  console.log('✅ Transaction record created for refund');
                }
              }
            } else {
              console.error('No checking account found for user');
            }
          } catch (balanceError) {
            console.error('Failed to update account balance:', balanceError);
          }
        }

        toast({
          title: 'Status updated',
          description: `Refund status changed to ${newStatus}. User has been notified.`,
        });

        setEditingRefund(null);
        setNewStatus('');
        await loadRefunds();
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: 'Failed to update status.',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const loadRefundEvents = async (refundId: string) => {
    const { data } = await supabase
      .from('refund_events')
      .select('*')
      .eq('refund_id', refundId)
      .order('created_at', { ascending: false });

    setEvents(data || []);
  };

  const handleViewDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    loadRefundEvents(refund.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="capitalize">
            {status}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-52 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAmount = refunds.reduce((sum, r) => sum + r.amount_cents, 0) / 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Refund Management
          </h2>
          <p className="text-muted-foreground mt-1">
            View, approve, and manage all refund requests
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Refund
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refunds.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {refunds.filter((r) => r.status === 'pending').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {refunds.filter((r) => r.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user or reference..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refunds ({filteredRefunds.length})</CardTitle>
          <CardDescription>
            Showing {filteredRefunds.length} of {refunds.length} refunds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh] md:max-h-[70vh] border rounded-lg p-1 bg-gray-50 dark:bg-gray-900/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-sm sticky top-0 bg-background">
                    Reference
                  </th>
                  <th className="pb-3 font-medium text-sm sticky top-0 bg-background">
                    User
                  </th>
                  <th className="pb-3 font-medium text-sm sticky top-0 bg-background">
                    Amount
                  </th>
                  <th className="pb-3 font-medium text-sm sticky top-0 bg-background">
                    Reason
                  </th>
                  <th className="pb-3 font-medium text-sm sticky top-0 bg-background">
                    Status
                  </th>
                  <th className="pb-3 font-medium text-sm sticky top-0 bg-background">
                    Created
                  </th>
                  <th className="pb-3 font-medium text-sm sticky top-0 bg-background">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRefunds.length > 0 ? (
                  filteredRefunds.map((refund) => (
                    <tr key={refund.id} className="border-b last:border-0">
                      <td className="py-3 md:py-4">
                        <p className="font-mono text-xs md:text-sm">
                          {refund.external_ref || refund.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="py-3 md:py-4">
                        <p className="font-medium text-xs md:text-sm">
                          {refund.user_name || 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground hidden md:block">
                          {refund.user_email}
                        </p>
                      </td>
                      <td className="py-3 md:py-4">
                        <p className="font-semibold text-sm md:text-base">
                          ${(refund.amount_cents / 100).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground hidden md:block">
                          {refund.currency || 'USD'}
                        </p>
                      </td>
                      <td className="py-3 md:py-4">
                        <p className="text-xs md:text-sm capitalize">
                          {refund.reason?.replace(/_/g, ' ') || 'N/A'}
                        </p>
                      </td>
                      <td className="py-3 md:py-4">
                        {getStatusBadge(refund.status)}
                      </td>
                      <td className="py-3 md:py-4">
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {new Date(refund.created_at).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3 md:py-4">
                        <div className="flex gap-1 md:gap-2 flex-wrap items-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(refund)}
                            className="h-8 w-8 md:h-9 md:w-auto md:px-3"
                          >
                            <Eye className="h-3 w-3 md:h-4 md:w-4" />
                            <span className="hidden md:inline ml-1">View</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAmount(refund)}
                            className="h-8 text-xs md:h-9 md:text-sm"
                          >
                            <span className="hidden md:inline">
                              Edit Amount
                            </span>
                            <span className="md:hidden">Amount</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditStatus(refund)}
                            className="h-8 text-xs md:h-9 md:text-sm"
                          >
                            <span className="hidden md:inline">
                              Edit Status
                            </span>
                            <span className="md:hidden">Status</span>
                          </Button>

                          {refund.status === 'pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(refund)}
                                disabled={processing === refund.id}
                                className="text-green-600 hover:text-green-700 h-10 w-10"
                              >
                                <CheckCircle className="h-6 w-6" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReject(refund)}
                                disabled={processing === refund.id}
                                className="text-red-600 hover:text-red-700 h-10 w-10"
                              >
                                <XCircle className="h-6 w-6" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center">
                      <p className="text-muted-foreground">No refunds found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Refund Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <CardTitle>Create New Refund</CardTitle>
              <CardDescription>
                Issue a refund to a user&apos;s account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRefund} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user">User</Label>
                  <select
                    id="user"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                  >
                    <option value="">Select user...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Initial Status</Label>
                  <select
                    id="status"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={initialStatus}
                    onChange={(e) => setInitialStatus(e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Set to &quot;Approved&quot; to make refund immediately
                    available for withdrawal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <select
                    id="reason"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="customer_request">Customer Request</option>
                    <option value="fraud_reversal">Fraud Reversal</option>
                    <option value="duplicate_payment">Duplicate Payment</option>
                    <option value="billing_error">Billing Error</option>
                    <option value="chargeback">Chargeback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    rows={3}
                    value={reasonNotes}
                    onChange={(e) => setReasonNotes(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setSelectedUserId('');
                      setAmount('');
                      setReasonNotes('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Refund'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingRefund && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Edit Refund Status</CardTitle>
              <CardDescription>
                Change the status of this refund
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Refund Details:</p>
                <p className="text-sm">
                  Amount: ${(editingRefund.amount_cents / 100).toFixed(2)}
                </p>
                <p className="text-sm">User: {editingRefund.user_name}</p>
                <p className="text-sm">
                  Current Status:{' '}
                  <span className="capitalize">{editingRefund.status}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newStatus">New Status</Label>
                <select
                  id="newStatus"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  The user will be notified of this status change.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingRefund(null);
                    setNewStatus('');
                  }}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={updating}>
                  {updating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Amount Modal */}
      {editingAmount && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Edit Refund Amount</CardTitle>
              <CardDescription>
                Update the amount for this refund
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-1">Refund Details:</p>
                <p className="text-sm">
                  Current Amount: $
                  {(editingAmount.amount_cents / 100).toFixed(2)}
                </p>
                <p className="text-sm">User: {editingAmount.user_name}</p>
                <p className="text-sm">
                  Status:{' '}
                  <span className="capitalize">{editingAmount.status}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newAmount">New Amount ($)</Label>
                <Input
                  id="newAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Enter new amount"
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  <strong>Note:</strong> This change will not notify the user.
                  Only the amount will be updated.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingAmount(null);
                    setNewAmount('');
                  }}
                  disabled={updatingAmount}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateAmount} disabled={updatingAmount}>
                  {updatingAmount ? 'Updating...' : 'Update Amount'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Refund Details - #
                  {selectedRefund.external_ref || selectedRefund.id.slice(0, 8)}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedRefund(null);
                    setEvents([]);
                  }}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">User</p>
                  <p className="font-medium">{selectedRefund.user_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedRefund.user_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold">
                    ${(selectedRefund.amount_cents / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(selectedRefund.status)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reason</p>
                  <p className="text-sm capitalize">
                    {selectedRefund.reason?.replace(/_/g, ' ') || 'N/A'}
                  </p>
                </div>
              </div>

              {selectedRefund.reason_notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Notes</p>
                    <p className="text-sm">{selectedRefund.reason_notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <h4 className="font-semibold mb-3">Event History</h4>
                <div className="space-y-3">
                  {events.length > 0 ? (
                    events.map((event) => (
                      <div
                        key={event.id}
                        className="border-l-2 border-primary pl-4 py-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="capitalize">
                            {event.event_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{event.message}</p>
                        {event.actor && (
                          <p className="text-xs text-muted-foreground mt-1">
                            By: {event.actor}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No events logged
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
