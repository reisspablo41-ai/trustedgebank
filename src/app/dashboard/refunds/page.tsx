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
import { useToast } from '@/components/ui/simple-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardNav } from '@/components/dashboard-nav';
import {
  RefreshCw,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';

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
};

type RefundEvent = {
  id: string;
  refund_id: string;
  event_type: string;
  actor: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export default function RefundsPage() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [events, setEvents] = useState<RefundEvent[]>([]);

  useEffect(() => {
    loadRefunds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRefunds = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading refunds:', error);
        toast({
          title: 'Error',
          description: 'Failed to load refunds.',
          variant: 'destructive',
        });
      } else {
        setRefunds(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRefunds();
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

  const filteredRefunds =
    statusFilter === 'all'
      ? refunds
      : refunds.filter((r) => r.status === statusFilter);

  if (loading) {
    return (
      <>
        <DashboardNav />
        <div className="container mx-auto max-w-6xl py-8 px-4">
          <div className="mb-8">
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-5 w-80" />
          </div>

          <div className="grid gap-4 md:grid-cols-4 mb-6">
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

          <Card className="mb-6">
            <CardContent className="pt-6">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNav />
      <div className="container mx-auto max-w-6xl py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">My Refunds</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your refund requests
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Refunds
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{refunds.length}</div>
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
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {(
                  refunds.reduce((sum, r) => sum + r.amount_cents, 0) / 100
                ).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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

              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Refunds List */}
        {filteredRefunds.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No refunds found</h3>
                <p className="text-muted-foreground">
                  {statusFilter === 'all'
                    ? "You don't have any refund requests yet."
                    : `No ${statusFilter} refunds found.`}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRefunds.map((refund) => (
              <Card key={refund.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Refund #{refund.external_ref || refund.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription>
                        {new Date(refund.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(refund.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="text-lg font-bold">
                        ${(refund.amount_cents / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Currency</p>
                      <p className="text-sm font-medium">
                        {refund.currency || 'USD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reason</p>
                      <p className="text-sm font-medium capitalize">
                        {refund.reason || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Processor</p>
                      <p className="text-sm font-medium">
                        {refund.processor || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {refund.reason_notes && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Notes
                        </p>
                        <p className="text-sm">{refund.reason_notes}</p>
                      </div>
                    </>
                  )}

                  {refund.failure_reason && (
                    <>
                      <Separator />
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                        <p className="text-sm text-red-900 dark:text-red-100">
                          <strong>Failure Reason:</strong>{' '}
                          {refund.failure_reason}
                        </p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(refund)}
                    >
                      View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Refund Details Modal/Card */}
        {selectedRefund && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Refund Details - #
                    {selectedRefund.external_ref ||
                      selectedRefund.id.slice(0, 8)}
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
                      {selectedRefund.reason || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(selectedRefund.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

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

        {/* Help Info */}
        {refunds.length > 0 && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">About Refunds</p>
                  <p className="text-muted-foreground">
                    Approved refunds are automatically credited to your checking
                    account. Pending refunds will show in your pending balance
                    until processed. Contact support if you have questions about
                    a refund.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
