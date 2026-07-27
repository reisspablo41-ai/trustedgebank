import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  console.log('📧 [API] KYC approved email endpoint called');

  try {
    const requestBody = await request.json();
    console.log('📧 [API] Request body received:', requestBody);

    const { email, userName } = requestBody;

    console.log('📧 [API] Parsed parameters:', { email, userName });

    if (!email || !userName) {
      console.error('📧 [API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📧 [API] Creating KYC approved template...');
    const template = emailTemplates.kycApproved(userName);

    console.log('📧 [API] Template created:', {
      subject: template.subject,
      htmlLength: template.html.length,
    });

    console.log('📧 [API] Calling sendEmail function...');
    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    console.log('📧 [API] sendEmail result:', result);

    if (!result.success) {
      console.error('📧 [API] Email send failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    console.log('✅ [API] KYC approved email sent successfully');
    return NextResponse.json({ success: true, emailId: result.data?.id });
  } catch (error) {
    console.error('❌ [API] KYC approved email error:', error);
    console.error('❌ [API] Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
