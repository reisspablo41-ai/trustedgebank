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
import { X, FileCheck, Camera, Image as ImageIcon } from 'lucide-react';
import { CameraCapture } from '@/components/CameraCapture';

type UploadedFile = {
  file: File;
  preview: string;
  name: string;
};

type DocumentType = {
  value: string;
  label: string;
  hasTwoSides: boolean;
};

const DOCUMENT_TYPES: DocumentType[] = [
  { value: 'passport', label: 'Passport', hasTwoSides: false },
  { value: 'drivers_license', label: "Driver's License", hasTwoSides: true },
  { value: 'national_id', label: 'National ID Card', hasTwoSides: true },
  { value: 'state_id', label: 'State ID', hasTwoSides: true },
];

export default function KycPage() {
  const router = useRouter();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Identity fields
  const [idType, setIdType] = useState<'ssn' | 'tin'>('ssn');
  const [idNumber, setIdNumber] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>(
    DOCUMENT_TYPES[0]
  );
  const [documentFront, setDocumentFront] = useState<UploadedFile | null>(null);
  const [documentBack, setDocumentBack] = useState<UploadedFile | null>(null);
  const [selfie, setSelfie] = useState<UploadedFile | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  // Address fields
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [proofOfAddress, setProofOfAddress] = useState<UploadedFile | null>(
    null
  );

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/auth/login');
        return;
      }
      if (!user.email_confirmed_at) {
        router.replace('/auth/verify-pending');
        return;
      }

      // Check if bank_users record exists, if not create it
      const { data: bankUser, error: bankError } = await supabase
        .from('bank_users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!bankUser && !bankError) {
        console.log('❌ Bank user missing (no error), creating...', { userId: user.id, email: user.email });
        const { error: upsertError } = await supabase.from('bank_users').upsert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name || 'User',
          kyc_status: 'pending',
        });
        if (upsertError) {
          console.error('❌ Failed to create bank_users:', upsertError);
          console.error('❌ Error code:', upsertError.code);
          console.error('❌ Error message:', upsertError.message);
          console.error('❌ Full error:', JSON.stringify(upsertError, null, 2));
        }
      } else if (bankError && bankError.code === 'PGRST116') {
        console.log('❌ Bank user profile missing (PGRST116), creating...', { userId: user.id, email: user.email });
        const { error: createError } = await supabase.from('bank_users').upsert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata.full_name || 'User',
          kyc_status: 'pending',
        });

        if (createError) {
          console.error('❌ Failed to create bank_users:', createError);
          console.error('❌ Error code:', createError.code);
          console.error('❌ Error message:', createError.message);
          console.error('❌ Full error:', JSON.stringify(createError, null, 2));
        }
      }

      setUserId(user.id);
      setSessionChecked(true);
    });
  }, [router]);

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024;
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];

    if (file.size > maxSize) return 'File size must be less than 10MB';
    if (!allowedTypes.includes(file.type))
      return 'Only JPG, PNG, and PDF files are allowed';
    return null;
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: UploadedFile | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setter({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    });
    setError(null);
  };

  const handleCameraCapture = (file: File) => {
    setSelfie({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    });
    setShowCamera(false);
  };

  const removeFile = (
    setter: (file: UploadedFile | null) => void,
    file: UploadedFile | null
  ) => {
    if (file) {
      URL.revokeObjectURL(file.preview);
      setter(null);
    }
  };

  const canProceedToStep2 = () => {
    if (!idNumber.trim()) return false;
    if (!documentFront) return false;
    if (selectedDocType.hasTwoSides && !documentBack) return false;
    return true;
  };

  const canProceedToStep3 = () => {
    return selfie !== null;
  };

  // Sanitize filename to remove spaces and special characters
  const sanitizeFilename = (filename: string): string => {
    return filename
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9.-]/g, '') // Remove special characters
      .toLowerCase();
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { error: uploadErr } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'northbridge-storage')
      .upload(path, file);
    if (uploadErr) throw uploadErr;

    const { data: publicUrl } = supabase.storage
      .from(process.env.NEXT_PUBLIC_STORAGE_BUCKET || 'northbridge-storage')
      .getPublicUrl(path);
    return publicUrl.publicUrl;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    // Comprehensive validation
    if (!documentFront) {
      setError('Please upload your identity document');
      return;
    }
    if (selectedDocType.hasTwoSides && !documentBack) {
      setError('Please upload both sides of your document');
      return;
    }
    if (!selfie) {
      setError('Please upload or take a selfie');
      return;
    }
    if (!address.trim() || !phoneNumber.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    if (!proofOfAddress) {
      setError('Please upload proof of address');
      return;
    }

    setError(null);
    setLoading(true);
    setUploadProgress(0);

    try {
      const timestamp = Date.now();
      const documentUrls: string[] = [];
      let uploaded = 0;
      const totalFiles = (documentFront ? 1 : 0) + (documentBack ? 1 : 0) + 2;

      console.log('Starting uploads...', { userId, totalFiles });

      // Upload document front
      if (documentFront) {
        console.log('Uploading front document...');
        const sanitizedName = sanitizeFilename(documentFront.file.name);
        const path = `${userId}/id-front-${timestamp}-${sanitizedName}`;
        const url = await uploadFile(documentFront.file, path);
        documentUrls.push(url);
        uploaded++;
        setUploadProgress(Math.round((uploaded / totalFiles) * 100));
        console.log('Front uploaded:', url);
      }

      // Upload document back if exists
      if (documentBack) {
        const sanitizedName = sanitizeFilename(documentBack.file.name);
        const path = `${userId}/id-back-${timestamp}-${sanitizedName}`;
        const url = await uploadFile(documentBack.file, path);
        documentUrls.push(url);
        uploaded++;
        setUploadProgress(Math.round((uploaded / totalFiles) * 100));
      }

      // Upload selfie
      if (selfie) {
        const sanitizedSelfieName = sanitizeFilename(selfie.file.name);
        const path = `${userId}/selfie-${timestamp}-${sanitizedSelfieName}`;
        const selfieUrl = await uploadFile(selfie.file, path);
        uploaded++;
        setUploadProgress(Math.round((uploaded / totalFiles) * 100));

        // Upload proof of address
        const sanitizedProofName = sanitizeFilename(proofOfAddress.file.name);
        const proofPath = `${userId}/proof-address-${timestamp}-${sanitizedProofName}`;
        const proofUrl = await uploadFile(proofOfAddress.file, proofPath);
        uploaded++;
        setUploadProgress(100);

        // Insert into kyc_submissions
        const kycData = {
          user_id: userId,
          identification_type: idType,
          identification_number: idNumber,
          document_urls: documentUrls,
          selfie_url: selfieUrl,
          address,
          phone_number: phoneNumber,
          proof_of_address_url: proofUrl,
          status: 'pending',
        };

        console.log('Inserting KYC submission:', kycData);

        const { data: inserted, error: insertErr } = await supabase
          .from('kyc_submissions')
          .insert(kycData)
          .select();

        if (insertErr) {
          console.error('Insert error details:', insertErr);
          throw insertErr;
        }

        console.log('KYC submitted successfully!', inserted);

        // Fetch user data for email notifications
        const { data: userData } = await supabase
          .from('bank_users')
          .select('email, full_name')
          .eq('id', userId)
          .single();

        // Send email notification to user
        try {
          if (userData) {
            await fetch('/api/emails/kyc-submitted', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: userData.email,
                userName: userData.full_name,
              }),
            });
            console.log('✅ KYC submitted email sent to user:', userData.email);
          }
        } catch (emailError) {
          console.error(
            'Failed to send KYC submitted email to user:',
            emailError
          );
        }

        // Send admin notification email
        try {
          console.log('📧 Sending admin notification for KYC submission...');
          await fetch('/api/emails/kyc-submitted-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              // Recipient is resolved server-side from ADMIN_EMAIL.
              userName: userData?.full_name || 'Unknown User',
              userEmail: userData?.email || 'unknown@example.com',
              submissionId: inserted[0]?.id || 'unknown',
              idType: idType,
              address: address,
              phoneNumber: phoneNumber,
            }),
          });
          console.log('✅ Admin notification sent for KYC submission');
        } catch (adminEmailError) {
          console.error('Failed to send admin notification:', adminEmailError);
        }

        setTimeout(() => router.push('/kyc/status'), 1000);
      }
    } catch (err) {
      console.error('KYC submission error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Submission failed';
      setError(`Error: ${errorMessage}`);
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) return null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
      <Badge className="mb-4">KYC Verification</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Verify your identity
      </h1>
      <p className="mt-2 text-muted-foreground">
        Complete verification in 3 simple steps.
      </p>

      {/* Progress Indicator */}
      <div className="mt-8 flex items-center justify-between max-w-md">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step < currentStep
                ? 'bg-primary text-primary-foreground'
                : step === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
                }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-16 md:w-24 h-1 mx-2 ${step < currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-8">
        {/* Step 1: Identity Documents */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Step 1: Identity information
              </CardTitle>
              <CardDescription>
                Provide your ID type, number, and upload documents
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="idType">Identification type *</Label>
                <select
                  id="idType"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as 'ssn' | 'tin')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
                  required
                >
                  <option value="ssn">SSN (Social Security Number)</option>
                  <option value="tin">TIN (Tax Identification Number)</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="idNumber">Identification number *</Label>
                <Input
                  id="idNumber"
                  placeholder="XXX-XX-XXXX"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="docType">Document type *</Label>
                <select
                  id="docType"
                  value={selectedDocType.value}
                  onChange={(e) => {
                    const selected = DOCUMENT_TYPES.find(
                      (dt) => dt.value === e.target.value
                    )!;
                    setSelectedDocType(selected);
                    // Reset files when changing doc type
                    if (documentFront)
                      removeFile(setDocumentFront, documentFront);
                    if (documentBack) removeFile(setDocumentBack, documentBack);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2"
                >
                  {DOCUMENT_TYPES.map((dt) => (
                    <option key={dt.value} value={dt.value}>
                      {dt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Front */}
              <div className="grid gap-2">
                <Label htmlFor="docFront">
                  {selectedDocType.hasTwoSides
                    ? 'Document (Front) *'
                    : 'Document *'}
                </Label>
                <Input
                  id="docFront"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => handleFileUpload(e, setDocumentFront)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear photo. Max 10MB. Accepted: JPG, PNG, PDF.
                </p>

                {documentFront && (
                  <div className="relative border rounded-md p-2 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-green-600" />
                    <span className="text-xs flex-1 truncate">
                      {documentFront.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeFile(setDocumentFront, documentFront)
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Document Back (if applicable) */}
              {selectedDocType.hasTwoSides && (
                <div className="grid gap-2">
                  <Label htmlFor="docBack">Document (Back) *</Label>
                  <Input
                    id="docBack"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,application/pdf"
                    onChange={(e) => handleFileUpload(e, setDocumentBack)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload the back side of your{' '}
                    {selectedDocType.label.toLowerCase()}.
                  </p>

                  {documentBack && (
                    <div className="relative border rounded-md p-2 flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-green-600" />
                      <span className="text-xs flex-1 truncate">
                        {documentBack.name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          removeFile(setDocumentBack, documentBack)
                        }
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Selfie Verification */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Step 2: Photo verification
              </CardTitle>
              <CardDescription>
                Take or upload a selfie to verify your identity
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {!showCamera && !selfie && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCamera(true)}
                    className="h-24"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="h-6 w-6" />
                      <span>Take selfie</span>
                    </div>
                  </Button>
                  <div className="grid gap-2">
                    <Label htmlFor="selfieUpload" className="cursor-pointer">
                      <div className="h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center gap-2 hover:border-primary transition-colors">
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-sm">Upload photo</span>
                      </div>
                    </Label>
                    <Input
                      id="selfieUpload"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={(e) => handleFileUpload(e, setSelfie)}
                      className="hidden"
                    />
                  </div>
                </div>
              )}

              {showCamera && (
                <CameraCapture
                  onCapture={handleCameraCapture}
                  onClose={() => setShowCamera(false)}
                />
              )}

              {selfie && !showCamera && (
                <div className="space-y-3">
                  <div className="aspect-square max-w-sm mx-auto border rounded-md overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selfie.preview}
                      alt="Selfie preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(setSelfie, selfie)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove and retake
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Address Verification */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Step 3: Address verification
              </CardTitle>
              <CardDescription>
                Provide your address and proof of residence
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="address">Full address *</Label>
                <Textarea
                  id="address"
                  placeholder="Street, City, State, ZIP"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">Phone number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (804) 973-0278"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="proofAddress">Proof of address *</Label>
                <Input
                  id="proofAddress"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={(e) => handleFileUpload(e, setProofOfAddress)}
                />
                <p className="text-xs text-muted-foreground">
                  Utility bill, bank statement, or lease agreement dated within
                  last 3 months.
                </p>

                {proofOfAddress && (
                  <div className="relative border rounded-md p-2 flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-green-600" />
                    <span className="text-xs flex-1 truncate">
                      {proofOfAddress.name}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        removeFile(setProofOfAddress, proofOfAddress)
                      }
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {loading && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading documents...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={loading}
            >
              Back
            </Button>
          )}

          {currentStep < totalSteps && (
            <Button
              type="button"
              onClick={() => {
                if (currentStep === 1 && !canProceedToStep2()) {
                  setError('Please complete all required fields');
                  return;
                }
                if (currentStep === 2 && !canProceedToStep3()) {
                  setError('Please upload or take a selfie');
                  return;
                }
                setError(null);
                setCurrentStep(currentStep + 1);
              }}
              disabled={loading}
            >
              Next
            </Button>
          )}

          {currentStep === totalSteps && (
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit KYC'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
