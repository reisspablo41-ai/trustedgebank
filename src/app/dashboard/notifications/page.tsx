'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supbaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Shield,
  Trash2,
} from 'lucide-react';
import { DashboardNav } from '@/components/dashboard-nav';
import { useToast } from '@/components/ui/simple-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Alert = {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    let query = supabase
      .from('alerts')
      .select(
        'id, type, title, message, severity, is_read, created_at, action_url'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter === 'unread') {
      query = query.eq('is_read', false);
    }

    const { data } = await query;
    setAlerts(data ?? []);
    setLoading(false);
  };

  const markAsRead = async (alertId: string) => {
    await supabase.from('alerts').update({ is_read: true }).eq('id', alertId);

    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, is_read: true } : a))
    );
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    toast({
      title: 'Notifications cleared',
      description: 'All notifications marked as read.',
    });

    await loadNotifications();
  };

  const deleteAlert = async (alertId: string) => {
    await supabase.from('alerts').delete().eq('id', alertId);

    setAlerts((prev) => prev.filter((a) => a.id !== alertId));

    toast({
      title: 'Notification deleted',
      description: 'Notification removed successfully.',
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'saving':
        return TrendingUp;
      case 'spending':
        return DollarSign;
      case 'bill_reminder':
        return AlertCircle;
      case 'security':
        return Shield;
      default:
        return Bell;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return {
          bg: 'bg-green-50 dark:bg-green-900/10',
          border: 'border-green-200 dark:border-green-900',
          iconColor: 'text-green-600',
          titleColor: 'text-green-900 dark:text-green-100',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/10',
          border: 'border-amber-200 dark:border-amber-900',
          iconColor: 'text-amber-600',
          titleColor: 'text-amber-900 dark:text-amber-100',
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/10',
          border: 'border-red-200 dark:border-red-900',
          iconColor: 'text-red-600',
          titleColor: 'text-red-900 dark:text-red-100',
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/10',
          border: 'border-blue-200 dark:border-blue-900',
          iconColor: 'text-blue-600',
          titleColor: 'text-blue-900 dark:text-blue-100',
        };
    }
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (loading) {
    return (
      <>
        <DashboardNav />
        <div className="mx-auto w-full max-w-4xl px-6 py-8 md:py-12">
          <div className="mb-8">
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>

          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-20" />
            ))}
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-32 mt-2" />
                    </div>
                  </div>
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
      <div className="mx-auto w-full max-w-4xl px-6 py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${
                    unreadCount > 1 ? 's' : ''
                  }`
                : 'You&apos;re all caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {filter === 'unread'
                    ? "You don't have any unread notifications"
                    : "You don't have any notifications yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => {
              const Icon = getAlertIcon(alert.type);
              const colors = getAlertColor(alert.severity);

              return (
                <Card
                  key={alert.id}
                  className={`${
                    !alert.is_read ? colors.bg + ' ' + colors.border : ''
                  }`}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div
                      className={`h-10 w-10 rounded-full ${
                        !alert.is_read ? colors.bg : 'bg-muted'
                      } flex items-center justify-center shrink-0`}
                    >
                      <Icon
                        className={`h-5 w-5 ${
                          !alert.is_read
                            ? colors.iconColor
                            : 'text-muted-foreground'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className={`font-semibold text-sm ${
                            !alert.is_read ? colors.titleColor : ''
                          }`}
                        >
                          {alert.title}
                        </h3>
                        {!alert.is_read && (
                          <Badge variant="default" className="shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {new Date(alert.created_at).toLocaleDateString(
                            'en-US',
                            {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            }
                          )}
                        </span>
                        {alert.action_url && (
                          <>
                            <span>•</span>
                            <a
                              href={alert.action_url}
                              className="text-primary hover:underline"
                            >
                              View details
                            </a>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!alert.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(alert.id)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
