import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, emailTemplates } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Card request email API called');
    const { email, userName, cardType, deliveryAddress } = await request.json();

    console.log('📧 Received payload:', {
      email,
      userName,
      cardType,
      hasAddress: !!deliveryAddress,
    });

    if (!email || !userName || !cardType || !deliveryAddress) {
      console.error('❌ Missing required fields:', {
        hasEmail: !!email,
        hasUserName: !!userName,
        hasCardType: !!cardType,
        hasDeliveryAddress: !!deliveryAddress,
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📧 Generating card request email template...');
    const template = emailTemplates.cardRequested(
      userName,
      cardType,
      deliveryAddress
    );

    console.log('📧 Template generated, sending email...');
    console.log('📧 Email subject:', template.subject);
    console.log('📧 Email to:', email);

    const result = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
    });

    if (!result.success) {
      console.error('❌ Email sending failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    console.log('✅ Card request email sent successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Card request email error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
