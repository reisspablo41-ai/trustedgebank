import { Resend } from 'resend';

// Constructed lazily: `new Resend(undefined)` throws, which would break the
// build (and any import of this module) whenever RESEND_API_KEY is unset.
let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

const FROM_EMAIL =
  process.env.NEXT_PUBLIC_FROM_EMAIL || 'Trust Edge Bank <noreply@resend.dev>';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: EmailOptions) {
  console.log('📧 Starting email send process...');
  console.log('📧 FROM_EMAIL:', FROM_EMAIL);
  console.log('📧 TO:', to);
  console.log('📧 SUBJECT:', subject);
  console.log('📧 REPLY_TO:', replyTo);
  console.log(
    '📧 RESEND_API_KEY exists:',
    !!process.env.RESEND_API_KEY
  );

  const resend = getResend();
  if (!resend) {
    console.warn('⚠️ RESEND_API_KEY is not set — skipping email send.');
    return { success: false, error: 'RESEND_API_KEY is not configured' };
  }

  try {
    console.log('📧 Calling resend.emails.send...');
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      ...(replyTo && { replyTo }),
    });

    if (error) {
      console.error('❌ Email send error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return { success: false, error };
    }

    console.log('✅ Email sent successfully:', data);
    console.log('✅ Email ID:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Email send exception:', error);
    console.error('❌ Exception details:', JSON.stringify(error, null, 2));
    return { success: false, error };
  }
}

// Email Template Helper Functions
const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, #0b4630 0%, #127a52 100%); padding: 40px 30px; text-align: center;">
    <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px;">
      TRUST EDGE BANK
    </h1>
    <p style="margin: 8px 0 0 0; color: #e5e7eb; font-size: 14px; letter-spacing: 1px;">
      Banking Made Simple
    </p>
  </div>
`;

const getEmailFooter = () => `
  <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">Need Assistance?</h3>
      <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
        Our customer support team is available 24/7 to help you.
      </p>
      <p style="margin: 10px 0;">
        <strong style="color: #1f2937;">Email:</strong> 
        <a href="mailto:contact@trustedgebank.com" style="color: #2563eb; text-decoration: none;">contact@trustedgebank.com</a>
      </p>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
      <p style="text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 10px 0;">
        This is an automated message from Trust Edge Bank. Please do not reply directly to this email.
      </p>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 10px 0;">
        &copy; ${new Date().getFullYear()} Trust Edge Bank. All rights reserved. Member FDIC.
      </p>
    </div>
  </div>
`;

const getButtonStyle = () =>
  'display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0b4630 0%, #127a52 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;';

// Email Templates

export const emailTemplates = {
  // 1. Welcome Email (Account Created)
  welcomeEmail: (userName: string, userEmail: string) => ({
    subject: 'Welcome to Trust Edge Bank - Your Account is Ready',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Welcome to Trust Edge Bank! We are thrilled to have you join our banking family. Your account has been successfully created and you're now part of a financial institution committed to making banking simple, secure, and accessible.
            </p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #0284c7; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #075985; font-size: 18px; margin: 0 0 10px 0;">📧 Account Information</h3>
              <p style="color: #0c4a6e; font-size: 15px; margin: 5px 0;">
                <strong>Email:</strong> ${userEmail}
              </p>
              <p style="color: #0c4a6e; font-size: 15px; margin: 5px 0;">
                <strong>Status:</strong> Active
              </p>
          </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">Next Steps to Get Started</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">1</div>
          </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Complete Your KYC Verification</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Verify your identity to unlock all banking features and ensure account security.</p>
          </div>
              </div>
              
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">2</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Set Up Your Accounts</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Once verified, your checking and savings accounts will be automatically created.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">3</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Start Banking</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Explore transfers, bill payments, cards, and all our banking services.</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/dashboard" style="${getButtonStyle()}">Access Your Dashboard</a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">🔒 Security Reminder</h4>
              <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0;">
                Trust Edge Bank will never ask for your password via email or phone. Always verify you're on our official website (www.trustedgebank.com) when logging in.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Sincerely,<br>
              <strong style="color: #1f2937;">The Trust Edge Bank Team</strong>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 2. KYC Submitted
  kycSubmitted: (userName: string) => ({
    subject: 'KYC Verification Submitted - Under Review',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for submitting your Know Your Customer (KYC) verification documents to Trust Edge Bank. We have received your information and our compliance team is now reviewing your submission.
            </p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #065f46; font-size: 18px; margin: 0 0 10px 0;">✓ Submission Received</h3>
              <p style="color: #047857; font-size: 15px; margin: 5px 0;">
                Your KYC documents have been successfully submitted and are now in our review queue.
              </p>
          </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">What Happens Next?</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">1</div>
            </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Document Review</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Our compliance team will carefully review your submitted documents to verify your identity.</p>
          </div>
              </div>
              
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">2</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Review Timeline</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Verification typically takes 24-48 business hours. You'll receive an email once the review is complete.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">3</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Account Activation</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Once approved, your checking and savings accounts will be created, and you'll have full access to all banking services.</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/kyc/status" style="${getButtonStyle()}">Check Status</a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">⏱️ Processing Time</h4>
              <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0;">
                Most KYC verifications are completed within 24-48 business hours. If we need any additional information, we'll contact you promptly.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Thank you for your patience,<br>
              <strong style="color: #1f2937;">Trust Edge Bank Compliance Team</strong>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 3. KYC Approved
  kycApproved: (userName: string) => ({
    subject: 'KYC Verification Approved - Welcome to Full Banking Access',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Congratulations! We are pleased to inform you that your Know Your Customer (KYC) verification has been successfully approved. Your Trust Edge Bank account is now fully activated, and you have complete access to all our banking services.
            </p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #065f46; font-size: 18px; margin: 0 0 10px 0;">✓ Verification Approved</h3>
              <p style="color: #047857; font-size: 15px; margin: 5px 0;">
                Your identity has been verified, and your checking and savings accounts are now active and ready to use.
              </p>
          </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">You Now Have Access To:</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                    <strong style="color: #1f2937;">Checking & Savings Accounts</strong>
                    <br>
                    <span style="color: #6b7280; font-size: 14px; margin-left: 28px;">Manage your finances with full account access</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                    <strong style="color: #1f2937;">Money Transfers</strong>
                    <br>
                    <span style="color: #6b7280; font-size: 14px; margin-left: 28px;">Send and receive money instantly</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                    <strong style="color: #1f2937;">Bill Payments</strong>
                    <br>
                    <span style="color: #6b7280; font-size: 14px; margin-left: 28px;">Pay bills securely and on time</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                    <strong style="color: #1f2937;">Debit Card Requests</strong>
                    <br>
                    <span style="color: #6b7280; font-size: 14px; margin-left: 28px;">Order your Trust Edge Bank debit card</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">✓</span>
                    <strong style="color: #1f2937;">All Premium Features</strong>
                    <br>
                    <span style="color: #6b7280; font-size: 14px; margin-left: 28px;">Access to refunds, statements, and more</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/dashboard" style="${getButtonStyle()}">Start Banking Now</a>
          </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">🎉 Welcome to Trust Edge Bank</h4>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                We're excited to have you as a fully verified member. Explore your dashboard to discover all the features and services we offer to make your banking experience seamless and secure.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Welcome aboard,<br>
              <strong style="color: #1f2937;">The Trust Edge Bank Team</strong>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 4. KYC Rejected
  kycRejected: (userName: string, reason?: string) => ({
    subject: 'KYC Verification - Additional Information Required',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Thank you for submitting your Know Your Customer (KYC) verification to Trust Edge Bank. After a careful review of your submission, we need additional information or clearer documentation to complete your verification process.
            </p>
            
            ${reason
        ? `<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #991b1b; font-size: 18px; margin: 0 0 10px 0;">⚠️ Reason for Review</h3>
              <p style="color: #b91c1c; font-size: 15px; margin: 5px 0;">
                ${reason}
              </p>
            </div>`
        : '<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 6px;"><h3 style="color: #991b1b; font-size: 18px; margin: 0 0 10px 0;">⚠️ Action Required</h3><p style="color: #b91c1c; font-size: 15px; margin: 5px 0;">Additional verification information is needed to proceed with your application.</p></div>'
      }
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">Next Steps to Complete Verification</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #ef4444; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">1</div>
          </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Review Your Documents</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Ensure all submitted documents are clear, legible, and show complete information.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #ef4444; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">2</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Verify Accuracy</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Double-check that all personal information matches your official identification documents.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #ef4444; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">3</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Resubmit Application</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Submit your updated KYC application with the corrected or additional information.</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/kyc" style="${getButtonStyle()}">Resubmit KYC Now</a>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">💡 Need Help?</h4>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                Our support team is here to assist you with the resubmission process. If you have questions about what information is needed, please don't hesitate to contact us.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              We look forward to serving you,<br>
              <strong style="color: #1f2937;">Trust Edge Bank Compliance Team</strong>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 5. Card Request Created
  cardRequested: (
    userName: string,
    cardType: string,
    deliveryAddress: string
  ) => ({
    subject: `Debit Card Request Confirmed - ${cardType}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              We have successfully received your request for a ${cardType} debit card from Trust Edge Bank. Your card is now being processed and will be delivered to your registered address shortly.
            </p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #065f46; font-size: 18px; margin: 0 0 10px 0;">💳 Card Request Confirmed</h3>
              <p style="color: #047857; font-size: 15px; margin: 5px 0;">
                Your ${cardType} card request has been approved and is now in production.
              </p>
          </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">Card Details</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Card Type</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600;">${cardType}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Delivery Address</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; max-width: 200px; word-wrap: break-word;">${deliveryAddress}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Expected Delivery</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600;">5-7 Business Days</td>
                </tr>
              </table>
            </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">What Happens Next?</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">1</div>
          </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Verification Call</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Our security team will contact you within 24 hours to verify your card request and confirm your identity.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">2</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Card Production</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Once verified, your card will be manufactured with enhanced security features and your personalized information.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">3</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Shipping Notification</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">You'll receive an email with tracking information once your card has been shipped.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #0284c7; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">4</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Card Delivery & Activation</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Upon receiving your card, follow the included instructions to activate it and set your PIN.</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/dashboard/cards" style="${getButtonStyle()}">Track Card Status</a>
            </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">🔒 Security Note</h4>
              <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0;">
                Your card will arrive in a sealed, unmarked envelope for security. Never share your card details, PIN, or CVV with anyone. Trust Edge Bank will never ask for this information via email or phone.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Thank you for choosing Trust Edge Bank,<br>
              <strong style="color: #1f2937;">Card Services Team</strong>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 6. Money Transfer Confirmation
  transferConfirmation: (
    userName: string,
    amount: number,
    recipient: string,
    reference: string
  ) => ({
    subject: `Money Transfer Successful - $${amount.toFixed(2)} Sent`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your money transfer of <strong>$${amount.toFixed(
      2
    )}</strong> has been successfully processed by Trust Edge Bank. The funds have been sent to the recipient and should be available in their account shortly.
            </p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #065f46; font-size: 18px; margin: 0 0 10px 0;">✓ Transfer Completed</h3>
              <p style="color: #047857; font-size: 15px; margin: 5px 0;">
                Your transaction has been successfully processed and the funds have been transferred.
              </p>
          </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">Transaction Details</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Transfer Amount</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 18px;">$${amount.toFixed(
      2
    )}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Recipient</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600;">${recipient}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Reference Number</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; font-family: monospace; font-size: 12px;">${reference}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Transaction Date</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600;">${new Date().toLocaleString(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    )}</td>
                </tr>
              </table>
              </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/dashboard/transactions" style="${getButtonStyle()}">View Transaction History</a>
              </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📋 Important Information</h4>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                Please keep this reference number for your records: <strong>${reference}</strong>. If you notice any discrepancies or did not authorize this transfer, please contact our fraud prevention team immediately at contact@trustedgebank.com or call +1 (804) 973-0278.
              </p>
              </div>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Thank you for banking with us,<br>
              <strong style="color: #1f2937;">Trust Edge Bank Transaction Team</strong>
            </p>
              </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 7. Bill Payment Confirmation
  billPaymentConfirmation: (
    userName: string,
    amount: number,
    payeeName: string,
    reference: string
  ) => ({
    subject: `Bill Payment Processed - $${amount.toFixed(2)} to ${payeeName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Your bill payment of <strong>$${amount.toFixed(
      2
    )}</strong> to ${payeeName} has been successfully processed through Trust Edge Bank. The payment has been submitted and should be credited to your payee's account within the standard processing time.
            </p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #065f46; font-size: 18px; margin: 0 0 10px 0;">✓ Payment Completed</h3>
              <p style="color: #047857; font-size: 15px; margin: 5px 0;">
                Your bill payment has been successfully processed and submitted to the payee.
              </p>
          </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">Payment Details</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Payment Amount</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 18px;">$${amount.toFixed(
      2
    )}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Payee Name</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600;">${payeeName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Confirmation Number</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; font-family: monospace; font-size: 12px;">${reference}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Payment Date</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600;">${new Date().toLocaleString(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    )}</td>
                </tr>
              </table>
              </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/dashboard/bills" style="${getButtonStyle()}">Manage Bill Payments</a>
              </div>
            
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">📋 Keep This For Your Records</h4>
              <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0;">
                Please save this confirmation number: <strong>${reference}</strong>. This serves as your proof of payment. If you have questions about this payment or need to verify it with the payee, use this reference number.
              </p>
              </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">⏱️ Processing Time</h4>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                Most bill payments are posted to payee accounts within 1-3 business days. Some payees may take longer depending on their processing systems. If you have concerns about payment timing, please contact the payee directly.
              </p>
              </div>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Thank you for using Trust Edge Bank,<br>
              <strong style="color: #1f2937;">Bill Payment Services Team</strong>
            </p>
            </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 8. Refund Created (User)
  refundCreated: (
    userName: string,
    amount: number,
    reason: string,
    refundId: string
  ) => ({
    subject: `Refund Request Processed - $${amount.toFixed(2)} - Trust Edge Bank`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #0b4630 0%, #127a52 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px;">
              TRUST EDGE BANK
            </h1>
            <p style="margin: 8px 0 0 0; color: #e5e7eb; font-size: 14px; letter-spacing: 1px;">
              Banking Made Simple
            </p>
          </div>
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              We have received and processed your refund request at Trust Edge Bank. This email confirms the details of your refund and outlines the next steps in the process.
            </p>
            
            <div style="background: #f0fdf4; border: 2px solid #16a34a; padding: 5px; margin: 30px 0; border-radius: 8px; text-align: center;">
              <div style="background: white; padding: 25px; border-radius: 6px;">
                <div style="display: inline-block; background: #16a34a; color: white; padding: 8px 20px; border-radius: 20px; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; margin-bottom: 15px;">
                  ✓ REFUND CREATED
            </div>
                <h3 style="color: #1f2937; font-size: 32px; margin: 10px 0; font-weight: 700;">$${amount.toFixed(
      2
    )}</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Refund Amount</p>
              </div>
            </div>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 25px; margin: 30px 0; border-radius: 8px;">
              <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">Refund Request Details</h3>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 14px;">Refund Amount:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #1f2937; font-size: 16px; font-weight: 700;">$${amount.toFixed(
      2
    )}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 14px;">Reason:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #1f2937; font-size: 15px; text-transform: capitalize;">${reason.replace(
      '_',
      ' '
    )}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 14px;">Reference ID:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #1f2937; font-size: 14px; font-family: monospace;">${refundId}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 14px;">Date Created:</strong>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                    <span style="color: #1f2937; font-size: 14px;">${new Date().toLocaleDateString(
      'en-US',
      { month: 'long', day: 'numeric', year: 'numeric' }
    )}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0;">
                    <strong style="color: #6b7280; font-size: 14px;">Status:</strong>
                  </td>
                  <td style="padding: 12px 0; text-align: right;">
                    <span style="display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">Processing</span>
                  </td>
                </tr>
              </table>
            </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">What Happens Next?</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin: 0 0 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="vertical-align: top; width: 40px; padding-top: 5px;">
                    <div style="width: 32px; height: 32px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fbbf24;">
                      <span style="color: #92400e; font-weight: bold; font-size: 14px;">1</span>
                    </div>
                  </td>
                  <td style="padding: 5px 0 15px 15px;">
                    <strong style="color: #1f2937; font-size: 15px;">Team Review (Within 24 Hours)</strong>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 5px 0 0 0;">
                      Our customer service team will contact you to verify the refund request and discuss the next steps.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 40px; padding-top: 5px;">
                    <div style="width: 32px; height: 32px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fbbf24;">
                      <span style="color: #92400e; font-weight: bold; font-size: 14px;">2</span>
                    </div>
                  </td>
                  <td style="padding: 5px 0 15px 15px;">
                    <strong style="color: #1f2937; font-size: 15px;">Refund Processing</strong>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 5px 0 0 0;">
                      Once approved, the refund amount will be credited to your checking account.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align: top; width: 40px; padding-top: 5px;">
                    <div style="width: 32px; height: 32px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fbbf24;">
                      <span style="color: #92400e; font-weight: bold; font-size: 14px;">3</span>
                    </div>
                  </td>
                  <td style="padding: 5px 0;">
                    <strong style="color: #1f2937; font-size: 15px;">Completion Confirmation</strong>
                    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 5px 0 0 0;">
                      You'll receive another email once the refund is completed. Processing typically takes 1-3 business days.
                    </p>
                  </td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/dashboard/refunds" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0b4630 0%, #127a52 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Track My Refund</a>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📋 Important Information</h4>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                Please keep this reference ID for your records: <strong>${refundId}</strong>. If you have any questions or need to follow up on this refund, use this reference number when contacting our support team.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 25px 0 0 0;">
              We appreciate your patience as we process your refund request.
            </p>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Sincerely,<br>
              <strong style="color: #1f2937;">Trust Edge Bank Customer Service Team</strong>
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb; margin-top: 40px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">Need Assistance?</h3>
              <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
                Our customer support team is available 24/7 to help you.
              </p>
              <p style="margin: 10px 0;">
                <strong style="color: #1f2937;">Email:</strong> 
                <a href="mailto:contact@trustedgebank.com" style="color: #2563eb; text-decoration: none;">contact@trustedgebank.com</a>
              </p>
              <p style="margin: 5px 0;">
                <strong style="color: #1f2937;">Phone:</strong> 
                <span style="color: #6b7280;">+1 (804) 973-0278</span>
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
              <p style="text-align: center; color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 10px 0;">
                This is an automated message from Trust Edge Bank. Please do not reply directly to this email.
              </p>
              <p style="text-align: center; color: #9ca3af; font-size: 12px; margin: 10px 0;">
                &copy; ${new Date().getFullYear()} Trust Edge Bank. All rights reserved. Member FDIC.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 9. Refund Status Updated
  refundStatusUpdate: (
    userName: string,
    amount: number,
    status: string,
    refundId: string
  ) => ({
    subject: `Refund Status Update - ${status.charAt(0).toUpperCase() + status.slice(1)
      } ($${amount.toFixed(2)})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              We are writing to inform you that the status of your refund request with Trust Edge Bank has been updated. Below are the current details of your refund.
            </p>
            
            <div style="background: ${status === 'posted' || status === 'completed'
        ? '#ecfdf5'
        : status === 'cancelled' || status === 'failed'
          ? '#fef2f2'
          : '#fef3c7'
      }; border-left: 4px solid ${status === 'posted' || status === 'completed'
        ? '#10b981'
        : status === 'cancelled' || status === 'failed'
          ? '#ef4444'
          : '#fbbf24'
      }; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: ${status === 'posted' || status === 'completed'
        ? '#065f46'
        : status === 'cancelled' || status === 'failed'
          ? '#991b1b'
          : '#92400e'
      }; font-size: 18px; margin: 0 0 10px 0;">
                ${status === 'posted' || status === 'completed'
        ? '✓'
        : status === 'cancelled' || status === 'failed'
          ? '✗'
          : '⏱️'
      } Status: ${status.charAt(0).toUpperCase() + status.slice(1)}
              </h3>
              <p style="color: ${status === 'posted' || status === 'completed'
        ? '#047857'
        : status === 'cancelled' || status === 'failed'
          ? '#b91c1c'
          : '#78350f'
      }; font-size: 15px; margin: 5px 0;">
                ${status === 'posted' || status === 'completed'
        ? 'Your refund has been successfully processed and the funds have been credited to your checking account.'
        : status === 'cancelled' || status === 'failed'
          ? 'Unfortunately, your refund request could not be processed. Please contact support for more information.'
          : 'Your refund request is currently being reviewed and processed by our team.'
      }
              </p>
          </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">Refund Details</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Refund Amount</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 18px;">$${amount.toFixed(
        2
      )}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Current Status</td>
                  <td style="padding: 12px 0; text-align: right;"><span style="display: inline-block; background: ${status === 'posted' || status === 'completed'
        ? '#ecfdf5'
        : status === 'cancelled' || status === 'failed'
          ? '#fef2f2'
          : '#fef3c7'
      }; color: ${status === 'posted' || status === 'completed'
        ? '#065f46'
        : status === 'cancelled' || status === 'failed'
          ? '#991b1b'
          : '#92400e'
      }; padding: 6px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">${status.toUpperCase()}</span></td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Reference ID</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; font-family: monospace; font-size: 12px;">${refundId}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/dashboard/refunds" style="${getButtonStyle()}">View Refund Status</a>
            </div>
            
            ${status === 'posted' || status === 'completed'
        ? `<div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">✓ Funds Credited</h4>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                The refund amount of $${amount.toFixed(
          2
        )} has been successfully credited to your checking account. The funds should be available immediately for your use.
              </p>
            </div>`
        : status === 'cancelled' || status === 'failed'
          ? `<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #991b1b; font-size: 16px; margin: 0 0 10px 0;">⚠️ Action May Be Required</h4>
              <p style="color: #991b1b; font-size: 14px; line-height: 1.6; margin: 0;">
                If you believe this refund should have been approved, or if you have questions about why it was not processed, please contact our customer support team for assistance.
              </p>
            </div>`
          : `<div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #92400e; font-size: 16px; margin: 0 0 10px 0;">⏱️ Processing in Progress</h4>
              <p style="color: #78350f; font-size: 14px; line-height: 1.6; margin: 0;">
                Your refund is currently being processed. You will receive another email notification once the refund is completed and the funds are available in your account.
              </p>
            </div>`
      }
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Thank you for your patience,<br>
              <strong style="color: #1f2937;">Trust Edge Bank Refunds Team</strong>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 10. Refund Created (Admin Notification)
  refundCreatedAdmin: (
    userName: string,
    userEmail: string,
    amount: number,
    reason: string,
    refundId: string
  ) => ({
    subject: `[Admin Alert] New Refund Request - ${userName} ($${amount.toFixed(
      2
    )})`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #0b4630 0%, #127a52 100%); padding: 30px; text-align: center;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
              🔔 ADMIN NOTIFICATION
            </h1>
            <p style="margin: 8px 0 0 0; color: #e5e7eb; font-size: 14px;">
              Trust Edge Bank - Refunds Management
            </p>
          </div>
          
          <div style="padding: 30px; background: #fefce8; border-left: 4px solid #eab308;">
            <h2 style="color: #713f12; font-size: 20px; margin: 0 0 10px 0;">⚠️ Action Required: New Refund Request</h2>
            <p style="color: #854d0e; font-size: 14px; margin: 0;">
              A customer has submitted a new refund request that requires admin review and approval.
            </p>
          </div>
          
          <div style="padding: 30px;">
            <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0;">Request Details</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Customer Name</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; font-weight: 600;">${userName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Customer Email</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; font-family: monospace; font-size: 13px;">${userEmail}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Refund Amount</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; font-weight: 700; font-size: 18px;">$${amount.toFixed(
      2
    )}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Reason</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; text-transform: capitalize;">${reason.replace(
      '_',
      ' '
    )}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Reference ID</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; font-family: monospace; font-size: 12px;">${refundId}</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.trustedgebank.com/admin/refunds" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0b4630 0%, #127a52 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Review Refund Request</a>
            </div>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #6b7280; font-size: 13px; margin: 0; line-height: 1.5;">
                <strong style="color: #1f2937;">Admin Actions:</strong> Log in to the admin panel to review the refund request, verify the customer's information, and approve or reject the refund accordingly.
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated admin notification from Trust Edge Bank Refunds System.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
              &copy; ${new Date().getFullYear()} Trust Edge Bank. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // 11. Refund Approved (User Notification)
  refundApproved: (userName: string, amount: number, refundId: string) => ({
    subject: `Refund Approved - $${amount.toFixed(2)} Being Processed`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${getEmailHeader()}
          
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0;">Dear ${userName},</h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Excellent news! We are pleased to inform you that your refund request has been reviewed and approved by our team at Trust Edge Bank. Your refund of <strong>$${amount.toFixed(
      2
    )}</strong> is now being processed and will be transferred to your checking account.
            </p>
            
            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 6px;">
              <h3 style="color: #065f46; font-size: 18px; margin: 0 0 10px 0;">✓ Refund Approved</h3>
              <p style="color: #047857; font-size: 15px; margin: 5px 0;">
                Your refund has been approved and will be credited to your checking account within 1-3 business days.
              </p>
            </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">Refund Details</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Refund Amount</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; font-size: 18px;">$${amount.toFixed(
      2
    )}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Status</td>
                  <td style="padding: 12px 0; text-align: right;"><span style="display: inline-block; background: #ecfdf5; color: #065f46; padding: 6px 12px; border-radius: 12px; font-size: 13px; font-weight: 600;">APPROVED</span></td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Reference ID</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600; font-family: monospace; font-size: 12px;">${refundId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #6b7280; font-size: 14px;">Approval Date</td>
                  <td style="padding: 12px 0; text-align: right; color: #1f2937; font-weight: 600;">${new Date().toLocaleString(
      'en-US',
      { month: 'long', day: 'numeric', year: 'numeric' }
    )}</td>
                </tr>
              </table>
            </div>
            
            <h3 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0;">What Happens Next?</h3>
            
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">1</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Transfer Initiated</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">Your refund is now being processed and will be transferred to your checking account.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%; margin-bottom: 15px;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">2</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Processing Time</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">The refund will typically be credited to your account within 1-3 business days.</p>
                </div>
              </div>
              
              <div style="display: table; width: 100%;">
                <div style="display: table-cell; width: 40px; vertical-align: top;">
                  <div style="width: 32px; height: 32px; background: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: bold;">3</div>
                </div>
                <div style="display: table-cell; vertical-align: top; padding-left: 15px;">
                  <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0;">Completion Notification</h4>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">You'll receive a final confirmation email once the funds are successfully credited to your account.</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://www.trustedgebank.com/dashboard/refunds" style="${getButtonStyle()}">Track Refund Status</a>
            </div>
            
            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 20px; margin: 30px 0;">
              <h4 style="color: #1e40af; font-size: 16px; margin: 0 0 10px 0;">📋 Important Information</h4>
              <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
                You can track the status of this refund in your dashboard at any time. The funds will appear in your checking account balance once the transfer is completed. If you have any questions, please contact our support team.
              </p>
            </div>
            
            <p style="color: #4b5563; font-size: 15px; margin: 20px 0 0 0;">
              Thank you for your patience,<br>
              <strong style="color: #1f2937;">Trust Edge Bank Refunds Team</strong>
            </p>
          </div>
          
          ${getEmailFooter()}
        </div>
      </body>
      </html>
    `,
  }),

  // 12. KYC Submitted (Admin Notification)
  kycSubmittedAdmin: (
    userName: string,
    userEmail: string,
    submissionId: string,
    idType: string,
    address: string,
    phoneNumber: string
  ) => ({
    subject: `🔔 New KYC Submission from ${userName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #fff; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 24px; background: #000; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .detail-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .urgent-box { background: #f9fafb; border-left: 4px solid #000; padding: 15px; margin: 20px 0; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 New KYC Submission</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Action Required - Review Required</p>
          </div>
          <div class="content">
            <h2>Admin Alert</h2>
            <p>A new KYC submission has been submitted and requires your review.</p>
            
            <div class="urgent-box">
              <p style="margin: 0; color: #374151;"><strong>⚠️ Action Required:</strong> Please review this KYC submission within 24-48 hours.</p>
            </div>

            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Customer Name</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; font-weight: 600;">${userName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Customer Email</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; font-family: monospace; font-size: 13px;">${userEmail}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Phone Number</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937;">${phoneNumber}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Address</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937;">${address}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">ID Type</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; text-transform: capitalize;">${idType}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f3f4f6;">
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Submission ID</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937; font-family: monospace; font-size: 12px;">${submissionId}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6b7280; font-size: 14px; font-weight: 600;">Submitted On</td>
                  <td style="padding: 10px 0; text-align: right; color: #1f2937;">${new Date().toLocaleString(
      'en-US',
      {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    )}</td>
                </tr>
              </table>
            </div>
            
            <a href="https://www.trustedgebank.com/admin/kyc" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #0b4630 0%, #127a52 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 30px auto; display: block; text-align: center; max-width: 250px;">Review KYC Documents</a>
            
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin-top: 20px;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 8px 0; line-height: 1.5;">
                <strong style="color: #1f2937;">Admin Actions:</strong> Log in to review documents and approve/reject.
              </p>
            </div>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Automated admin notification from Trust Edge Bank Compliance System.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
              &copy; ${new Date().getFullYear()} Trust Edge Bank. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};
