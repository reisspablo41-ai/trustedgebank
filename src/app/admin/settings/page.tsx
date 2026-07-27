'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings as SettingsIcon, Shield, Database, Bell } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground mt-1">
          Configure admin panel and system settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Security Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle className="text-base">Security</CardTitle>
            </div>
            <CardDescription>Admin access and permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">
                  Require 2FA for admin login
                </p>
              </div>
              <Badge variant="outline">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Session Timeout</p>
                <p className="text-xs text-muted-foreground">
                  Auto-logout after inactivity
                </p>
              </div>
              <Badge variant="outline">30 minutes</Badge>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle className="text-base">Database</CardTitle>
            </div>
            <CardDescription>Backup and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Auto Backup</p>
                <p className="text-xs text-muted-foreground">
                  Daily automated backups
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Last Backup</p>
                <p className="text-xs text-muted-foreground">
                  Most recent backup time
                </p>
              </div>
              <Badge variant="outline">Today, 3:00 AM</Badge>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Database className="h-4 w-4 mr-2" />
              Manage Backups
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>Admin alert preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">KYC Submission Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Notify on new KYC submissions
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Enabled
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Large Transaction Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Notify on transactions &gt; $10,000
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Enabled
              </Badge>
            </div>
            <Button variant="outline" className="w-full" disabled>
              <Bell className="h-4 w-4 mr-2" />
              Configure Alerts
            </Button>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <CardTitle className="text-base">System Information</CardTitle>
            </div>
            <CardDescription>Platform details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Version</p>
                <p className="text-xs text-muted-foreground">
                  Current platform version
                </p>
              </div>
              <Badge variant="outline">v1.0.0</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Environment</p>
                <p className="text-xs text-muted-foreground">
                  Deployment environment
                </p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Production
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Uptime</p>
                <p className="text-xs text-muted-foreground">
                  System availability
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                99.9%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

