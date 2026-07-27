'use client';

import { useState } from 'react';
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
import { useToast } from '@/components/ui/simple-toast';
import { Send, AlertCircle } from 'lucide-react';

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<
    'info' | 'success' | 'warning' | 'error'
  >('info');
  const [targetType, setTargetType] = useState<'all' | 'pending_kyc'>('all');

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !message) {
      toast({
        title: 'Validation error',
        description: 'Please fill in title and message.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);

    try {
      // Get target users
      let query = supabase.from('bank_users').select('id');

      if (targetType === 'pending_kyc') {
        query = query.eq('kyc_status', 'pending');
      }

      const { data: targetUsers, error: usersError } = await query;

      if (usersError || !targetUsers || targetUsers.length === 0) {
        toast({
          title: 'Error',
          description: 'No users found for this target.',
          variant: 'destructive',
        });
        setSending(false);
        return;
      }

      // Create alerts for all target users
      const alerts = targetUsers.map((user) => ({
        user_id: user.id,
        type: 'general',
        title,
        message,
        severity,
        is_read: false,
      }));

      const { error: insertError } = await supabase
        .from('alerts')
        .insert(alerts);

      if (insertError) {
        console.error('Error sending notifications:', insertError);
        toast({
          title: 'Error',
          description: 'Failed to send notifications.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Notifications sent',
          description: `Successfully sent to ${targetUsers.length} users.`,
        });

        // Reset form
        setTitle('');
        setMessage('');
        setSeverity('info');
        setTargetType('all');
      }
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground mt-1">
          Send announcements and alerts to users
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Notification</CardTitle>
          <CardDescription>Broadcast a notification to users</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendNotification} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="targetType">Target Audience</Label>
              <select
                id="targetType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={targetType}
                onChange={(e) =>
                  setTargetType(e.target.value as 'all' | 'pending_kyc')
                }
              >
                <option value="all">All Users</option>
                <option value="pending_kyc">Pending KYC Users</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={severity}
                onChange={(e) =>
                  setSeverity(
                    e.target.value as 'info' | 'success' | 'warning' | 'error'
                  )
                }
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Notification message..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Preview</p>
                <p className="text-blue-700 dark:text-blue-300">
                  {targetType === 'all'
                    ? 'This notification will be sent to all users.'
                    : 'This notification will be sent to users with pending KYC.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTitle('');
                  setMessage('');
                  setSeverity('info');
                  setTargetType('all');
                }}
              >
                Clear
              </Button>
              <Button type="submit" disabled={sending}>
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : 'Send Notification'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notification Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>Common notification templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => {
                setTitle('System Maintenance');
                setMessage(
                  'Scheduled maintenance will occur on [DATE] from [TIME] to [TIME]. Services may be temporarily unavailable.'
                );
                setSeverity('warning');
              }}
            >
              <div className="text-left">
                <p className="font-medium">System Maintenance</p>
                <p className="text-xs text-muted-foreground">
                  Scheduled downtime notice
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => {
                setTitle('Complete Your KYC');
                setMessage(
                  'Your account is almost ready! Please complete your KYC verification to start using all banking features.'
                );
                setSeverity('info');
                setTargetType('pending_kyc');
              }}
            >
              <div className="text-left">
                <p className="font-medium">KYC Reminder</p>
                <p className="text-xs text-muted-foreground">
                  For pending KYC users
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => {
                setTitle('New Feature Available');
                setMessage(
                  "We've just launched [FEATURE]! Check it out in your dashboard."
                );
                setSeverity('success');
              }}
            >
              <div className="text-left">
                <p className="font-medium">Feature Announcement</p>
                <p className="text-xs text-muted-foreground">
                  New feature launch
                </p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start h-auto py-3"
              onClick={() => {
                setTitle('Security Alert');
                setMessage(
                  'We detected unusual activity on your account. Please review your recent transactions and contact support if you notice anything suspicious.'
                );
                setSeverity('error');
              }}
            >
              <div className="text-left">
                <p className="font-medium">Security Alert</p>
                <p className="text-xs text-muted-foreground">
                  Urgent security notice
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
