'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { useToast } from '@/components/ui/simple-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    Clock,
    Shield,
    User as UserIcon,
    CreditCard,
    Calendar,
    MapPin,
    Phone,
    Mail,
} from 'lucide-react';

type UserDetail = {
    id: string;
    email: string;
    full_name: string;
    phone_number: string;
    address: string;
    kyc_status: string;
    created_at: string;
};

type KYCSubmission = {
    id: string;
    identification_type: string;
    identification_number: string;
    document_urls: string[];
    selfie_url: string;
    proof_of_address_url: string;
    status: string;
    submitted_at: string;
};

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [kyc, setKyc] = useState<KYCSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const userId = params.id as string;

    useEffect(() => {
        if (userId) {
            loadUserData();
        }
    }, [userId]);

    const loadUserData = async () => {
        try {
            setLoading(true);

            // Fetch user details
            const { data: userData, error: userError } = await supabase
                .from('bank_users')
                .select('*')
                .eq('id', userId)
                .single();

            if (userError) throw userError;
            setUser(userData);

            // Fetch KYC submission
            const { data: kycData, error: kycError } = await supabase
                .from('kyc_submissions')
                .select('*')
                .eq('user_id', userId)
                .order('submitted_at', { ascending: false })
                .limit(1)
                .single();

            if (!kycError && kycData) {
                setKyc(kycData);
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            toast({
                title: 'Error',
                description: 'Failed to load user details.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApproveKYC = async () => {
        if (!user) return;
        setProcessing(true);
        try {
            // Update bank_users
            const { error: userUpdateError } = await supabase
                .from('bank_users')
                .update({ kyc_status: 'approved' })
                .eq('id', user.id);

            if (userUpdateError) throw userUpdateError;

            // Update kyc_submissions if exists
            if (kyc) {
                await supabase
                    .from('kyc_submissions')
                    .update({ status: 'approved', reviewed_at: new Date().toISOString() })
                    .eq('id', kyc.id);
            }

            // Create accounts (checking/savings) if needed - generic logic handled here or via trigger/admin page logic
            // For simplicity in this view, we focus on status update. 
            // Ideally the logic from the main admin page should be reused or centralized.
            // We will perform a simplified account creation check here just in case.

            const { data: existingAccounts } = await supabase
                .from('accounts')
                .select('id')
                .eq('user_id', user.id);

            if (!existingAccounts || existingAccounts.length === 0) {
                // Create checking
                await supabase.from('accounts').insert({
                    user_id: user.id,
                    account_type: 'checking',
                    account_number: Math.floor(Math.random() * 10000000000).toString().padStart(10, '0'),
                    balance: 0
                });
                // Create savings
                await supabase.from('accounts').insert({
                    user_id: user.id,
                    account_type: 'savings',
                    account_number: Math.floor(Math.random() * 10000000000).toString().padStart(10, '0'),
                    balance: 0
                });
            }

            // Send email (via API)
            if (user.email) {
                fetch('/api/emails/kyc-approved', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, userName: user.full_name })
                }).catch(console.error);
            }

            toast({
                title: 'Success',
                description: 'KYC approved successfully.',
            });

            loadUserData(); // Reload
        } catch (err: any) {
            console.error('Error approving KYC:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to approve KYC.',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectKYC = async () => {
        if (!user) return;
        setProcessing(true);
        try {
            await supabase
                .from('bank_users')
                .update({ kyc_status: 'rejected' })
                .eq('id', user.id);

            if (kyc) {
                await supabase
                    .from('kyc_submissions')
                    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
                    .eq('id', kyc.id);
            }

            // Send email (via API)
            if (user.email) {
                fetch('/api/emails/kyc-rejected', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, userName: user.full_name })
                }).catch(console.error);
            }

            toast({
                title: 'Success',
                description: 'KYC rejected.',
            });
            loadUserData();
        } catch (err: any) {
            console.error('Error rejecting KYC:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to reject KYC.',
                variant: 'destructive',
            });
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" /> Approved
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <XCircle className="h-3 w-3 mr-1" /> Rejected
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold">User not found</h2>
                <Button onClick={() => router.back()} className="mt-4">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="rounded-full"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Details</h2>
                    <p className="text-muted-foreground">
                        Manage user information and verification
                    </p>
                </div>
                <div className="ml-auto">
                    {user.kyc_status === 'pending' && (
                        <div className="flex gap-2">
                            <Button onClick={handleApproveKYC} disabled={processing} className="bg-green-600 hover:bg-green-700 text-white">
                                <CheckCircle className="h-4 w-4 mr-2" /> Approve KYC
                            </Button>
                            <Button onClick={handleRejectKYC} disabled={processing} variant="destructive">
                                <XCircle className="h-4 w-4 mr-2" /> Reject KYC
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Profile Card */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-primary" />
                            Profile Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <UserIcon className="h-4 w-4" /> Full Name
                                </span>
                                <p className="font-medium text-lg">{user.full_name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" /> Email
                                </span>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Phone
                                </span>
                                <p className="font-medium">{user.phone_number || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> Address
                                </span>
                                <p className="font-medium">{user.address || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Joined
                                </span>
                                <p className="font-medium">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> Current Status
                                </span>
                                <div>{getStatusBadge(user.kyc_status)}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KYC Status Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            KYC Status
                        </CardTitle>
                        <CardDescription>Document submission summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {kyc ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-sm text-muted-foreground">ID Type</span>
                                        <span className="font-medium uppercase">{kyc.identification_type}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                        <span className="text-sm text-muted-foreground">ID Number</span>
                                        <span className="font-medium font-mono">{kyc.identification_number}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm font-medium">Identity Document</span>
                                        <Badge variant={kyc.document_urls && kyc.document_urls.length > 0 ? "default" : "secondary"}>
                                            {kyc.document_urls && kyc.document_urls.length > 0 ? "Submitted" : "Not Submitted"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm font-medium">Selfie Status</span>
                                        <Badge variant={kyc.selfie_url ? "default" : "secondary"}>
                                            {kyc.selfie_url ? "Submitted" : "Not Submitted"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-sm font-medium">Proof of Address</span>
                                        <Badge variant={kyc.proof_of_address_url ? "default" : "secondary"}>
                                            {kyc.proof_of_address_url ? "Submitted" : "Not Submitted"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground text-center mt-4">
                                    Submitted on {new Date(kyc.submitted_at).toLocaleString()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>No KYC documents submitted yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
