import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Mobile app notification request received');
    
    const body = await request.json();
    const { email } = body;

    console.log('📝 Notify me email:', email);

    if (!email) {
      console.error('❌ Email is required');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Send notification to admin
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Mobile App Launch Notification Request</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 3px solid #000000;">
                      <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #000000;">Trust Edge Bank</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #000000;">📱 New Mobile App Launch Notification Request</h2>
                      
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                        A user has requested to be notified when the Trust Edge Bank mobile app launches.
                      </p>

                      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin-bottom: 24px; border-radius: 4px;">
                        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #166534;">Email to Notify:</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #166534;">
                          <a href="mailto:${email}" style="color: #166534; text-decoration: none;">${email}</a>
                        </p>
                      </div>

                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 12px; border: 1px solid #e2e8f0; background-color: #f7fafc; font-weight: 600; width: 150px;">Request Date:</td>
                          <td style="padding: 12px; border: 1px solid #e2e8f0; background-color: #ffffff;">${new Date().toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px; border: 1px solid #e2e8f0; background-color: #f7fafc; font-weight: 600;">Source:</td>
                          <td style="padding: 12px; border: 1px solid #e2e8f0; background-color: #ffffff;">Mobile App Page (/mobile-app)</td>
                        </tr>
                      </table>

                      <p style="margin: 0; font-size: 14px; color: #718096; line-height: 1.6;">
                        <strong>Action Required:</strong><br>
                        • Add this email to your mobile app launch notification list<br>
                        • When the app launches, send them a notification email<br>
                        • Include download links for both iOS and Android
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0 0 8px; font-size: 12px; color: #718096; text-align: center;">
                        This is an automated notification from the Trust Edge Bank mobile app page.
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #718096; text-align: center;">
                        © ${new Date().getFullYear()} Trust Edge Bank. All rights reserved.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const result = await sendEmail({
      to: 'contact@trustedgebank.com',
      subject: `📱 Mobile App Launch Notification Request - ${email}`,
      html: emailContent,
    });

    if (result.success) {
      console.log('✅ Mobile app notification request email sent successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Thank you! We\'ll notify you when the app is ready.' 
      });
    } else {
      console.error('❌ Failed to send notification request email:', result.error);
      return NextResponse.json(
        { error: 'Failed to submit request. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Notification request error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

