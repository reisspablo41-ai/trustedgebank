import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  console.log('📧 [API] Refund created email endpoint called');

  try {
    const requestBody = await request.json();
    console.log('📧 [API] Request body received:', requestBody);

    const { email, userName, amount, reason, refundId, userEmail, isAdmin } =
      requestBody;

    console.log('📧 [API] Parsed parameters:', {
      email,
      userName,
      amount,
      reason,
      refundId,
      userEmail,
      isAdmin,
    });

    if (!email) {
      console.error('📧 [API] Missing email field');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📧 [API] Creating email template...');
    let template;
    if (isAdmin) {
      console.log('📧 [API] Creating admin notification template');
      // Send admin notification
      template = emailTemplates.refundCreatedAdmin(
        userName,
        userEmail,
        amount,
        reason,
        refundId
      );
    } else {
      console.log('📧 [API] Creating user notification template');
      // Send user notification
      template = emailTemplates.refundCreated(
        userName,
        amount,
        reason,
        refundId
      );
    }

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

    console.log('✅ [API] Email sent successfully');
    return NextResponse.json({ success: true, emailId: result.data?.id });
  } catch (error) {
    console.error('❌ [API] Refund created email error:', error);
    console.error('❌ [API] Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
