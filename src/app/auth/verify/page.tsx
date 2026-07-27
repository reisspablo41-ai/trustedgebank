import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function VerifyPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-16 md:py-20">
      <Badge className="mb-4">Verify email</Badge>
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
        Check your inbox
      </h1>
      <div className="mt-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confirm your email</CardTitle>
            <CardDescription>
              Click the link we sent to proceed to KYC
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 text-sm text-muted-foreground">
            After you confirm your email, return to the app to complete identity
            verification and open your account.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
