import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Contact form submission received');
    
    const body = await request.json();
    const { name, email, message } = body;

    console.log('📝 Contact form data:', { name, email, messageLength: message?.length });

    if (!name || !email || !message) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Send email to admin
    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Form Submission</title>
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
                      <h2 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #000000;">New Contact Form Submission</h2>
                      
                      <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4a5568;">
                        You have received a new message from the contact form on Trust Edge Bank website.
                      </p>

                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                        <tr>
                          <td style="padding: 12px; border: 1px solid #e2e8f0; background-color: #f7fafc; font-weight: 600; width: 120px;">Name:</td>
                          <td style="padding: 12px; border: 1px solid #e2e8f0; background-color: #ffffff;">${name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px; border: 1px solid #e2e8f0; background-color: #f7fafc; font-weight: 600;">Email:</td>
                          <td style="padding: 12px; border: 1px solid #e2e8f0; background-color: #ffffff;">
                            <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
                          </td>
                        </tr>
                      </table>

                      <div style="background-color: #f7fafc; border-left: 4px solid #000000; padding: 16px; margin-bottom: 24px;">
                        <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #4a5568;">Message:</p>
                        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #1a202c; white-space: pre-wrap;">${message}</p>
                      </div>

                      <p style="margin: 0; font-size: 14px; color: #718096;">
                        Reply directly to this email or contact the customer at 
                        <a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f7fafc; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                      <p style="margin: 0 0 8px; font-size: 12px; color: #718096; text-align: center;">
                        This is an automated message from the Trust Edge Bank contact form.
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
      subject: `Contact Form: Message from ${name}`,
      html: emailContent,
      replyTo: email,
    });

    if (result.success) {
      console.log('✅ Contact form email sent successfully');
      return NextResponse.json({ 
        success: true, 
        message: 'Your message has been sent successfully!' 
      });
    } else {
      console.error('❌ Failed to send contact form email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Contact form error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

