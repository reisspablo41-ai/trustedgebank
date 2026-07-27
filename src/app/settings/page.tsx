'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supbaseClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Bell, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/simple-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Validation errors
  const [phoneError, setPhoneError] = useState('');
  const [addressError, setAddressError] = useState('');

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUserData = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.replace('/auth/login');
      return;
    }

    setUserId(authUser.id);
    setEmail(authUser.email || '');

    // Get full name from bank_users table
    const { data: bankUser } = await supabase
      .from('bank_users')
      .select('full_name')
      .eq('id', authUser.id)
      .single();

    // Set full name (fallback to auth metadata or email)
    setFullName(
      bankUser?.full_name ||
        authUser.user_metadata?.full_name ||
        authUser.email?.split('@')[0] ||
        ''
    );

    // Get phone and address from KYC submission table
    const { data: kycData, error: kycError } = await supabase
      .from('kyc_submissions')
      .select('phone_number, address')
      .eq('user_id', authUser.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single();

    console.log('KYC data:', { kycData, kycError });

    if (kycData) {
      setPhone(kycData.phone_number || '');
      setAddress(kycData.address || '');
    } else if (kycError && kycError.code !== 'PGRST116') {
      // Only show error if it's not "no rows" error
      console.error('Error fetching KYC data:', kycError);
    }

    setLoading(false);
  };

  const validatePhone = (phoneNum: string): boolean => {
    // Basic validation: must be at least 10 digits
    const digitsOnly = phoneNum.replace(/\D/g, '');
    if (phoneNum.trim() && digitsOnly.length < 10) {
      setPhoneError('Phone number must be at least 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const validateAddress = (addr: string): boolean => {
    if (addr.trim() && addr.trim().length < 10) {
      setAddressError('Address must be at least 10 characters');
      return false;
    }
    setAddressError('');
    return true;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const phoneValid = validatePhone(phone);
    const addressValid = validateAddress(address);

    if (!phoneValid || !addressValid) {
      return;
    }

    setSaving(true);

    try {
      // Update phone_number and address in kyc_submissions (source of truth)
      const { error: kycError } = await supabase
        .from('kyc_submissions')
        .update({
          phone_number: phone.trim() || null,
          address: address.trim() || null,
        })
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (kycError) {
        console.error('KYC update error:', kycError);
        toast({
          title: 'Update failed',
          description:
            kycError.message || 'Could not save changes. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Profile updated',
          description: 'Your profile information has been saved successfully.',
        });

        // Optional: Log to audit table
        await supabase.from('audit_log').insert({
          user_id: userId,
          action: 'update_profile',
          entity_type: 'kyc_submissions',
          entity_id: userId,
          new_values: { phone_number: phone, address },
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
      <Badge className="mb-4">Settings</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Account Settings
      </h1>
      <p className="mt-2 text-muted-foreground">
        Manage your profile and preferences
      </p>

      <div className="mt-8 space-y-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Information
            </CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Name changes require identity verification. Contact support.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    validatePhone(e.target.value);
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  placeholder="+1 (804) 973-0278"
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? 'phone-error' : undefined}
                />
                {phoneError && (
                  <p
                    id="phone-error"
                    className="text-xs text-red-600"
                    role="alert"
                  >
                    {phoneError}
                  </p>
                )}
                {!phoneError && (
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll use this for account recovery and notifications.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    validateAddress(e.target.value);
                  }}
                  onBlur={(e) => validateAddress(e.target.value)}
                  placeholder="Street, City, State, ZIP Code"
                  aria-invalid={!!addressError}
                  aria-describedby={addressError ? 'address-error' : undefined}
                  rows={3}
                />
                {addressError && (
                  <p
                    id="address-error"
                    className="text-xs text-red-600"
                    role="alert"
                  >
                    {addressError}
                  </p>
                )}
                {!addressError && (
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll use this address for statements and verification.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={saving || !!phoneError || !!addressError}
                aria-busy={saving}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">
                  Last changed 30 days ago
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
            <Separator className="h-px" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">
                  Add extra security to your account
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <Separator className="h-px" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Sessions</p>
                <p className="text-xs text-muted-foreground">
                  Manage devices with access to your account
                </p>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </CardTitle>
            <CardDescription>Choose what updates you receive</CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Transaction Alerts</p>
                <p className="text-xs text-muted-foreground">
                  Get notified of account activity
                </p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            <Separator className="h-px" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Monthly Statements</p>
                <p className="text-xs text-muted-foreground">
                  Receive statements via email
                </p>
              </div>
              <Badge variant="default">Enabled</Badge>
            </div>
            <Separator className="h-px" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Marketing Emails</p>
                <p className="text-xs text-muted-foreground">
                  Product updates and offers
                </p>
              </div>
              <Badge variant="outline">Disabled</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Linked Accounts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Linked Accounts
            </CardTitle>
            <CardDescription>
              Connect external accounts for easy transfers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              No external accounts linked yet.
            </p>
            <Button variant="outline" size="sm">
              Link Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
