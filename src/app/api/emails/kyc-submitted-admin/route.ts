import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates, ADMIN_EMAIL } from '@/lib/email';

export async function POST(request: NextRequest) {
  console.log('📧 [API] KYC submitted admin notification endpoint called');

  try {
    const requestBody = await request.json();
    console.log('📧 [API] Request body received:', requestBody);

    // The recipient is deliberately NOT read from the body — it is always the
    // configured admin inbox. Accepting it from the caller would let anyone
    // send mail from our verified domain to any address.
    const { userName, userEmail, submissionId, idType, address, phoneNumber } =
      requestBody;

    console.log('📧 [API] Parsed parameters:', {
      adminEmail: ADMIN_EMAIL,
      userName,
      userEmail,
      submissionId,
      idType,
      address,
      phoneNumber,
    });

    if (!userName || !userEmail || !submissionId) {
      console.error('📧 [API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📧 [API] Creating admin notification template...');
    const template = emailTemplates.kycSubmittedAdmin(
      userName,
      userEmail,
      submissionId,
      idType,
      address,
      phoneNumber
    );

    console.log('📧 [API] Template created:', {
      subject: template.subject,
      htmlLength: template.html.length,
    });

    console.log('📧 [API] Calling sendEmail function...');
    const result = await sendEmail({
      to: ADMIN_EMAIL,
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

    console.log('✅ [API] Admin notification email sent successfully');
    return NextResponse.json({ success: true, emailId: result.data?.id });
  } catch (error) {
    console.error('❌ [API] KYC admin notification email error:', error);
    console.error('❌ [API] Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
