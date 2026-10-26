import nodemailer from 'nodemailer';

interface SendMailResult {
  sent: boolean;
  reason?: string;
  error?: string;
}

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let transporter: MailTransporter | null = null;

function getTransporter(): MailTransporter | null {
  const host = process.env.SMTP_HOST || (process.env.SMTP_USER?.includes('@gmail.com') ? 'smtp.gmail.com' : undefined);
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  return transporter;
}

export async function sendOtpEmail(toEmail: string, otp: string): Promise<SendMailResult> {
  const tx = getTransporter();

  if (!tx) {
    console.log('\n======================================================');
    console.log(`[MAILER NOTICE] 📧 SMTP Credentials Not Set in Environment`);
    console.log(`Recipient: ${toEmail}`);
    console.log(`Verification OTP: ${otp}`);
    console.log(`To dispatch real emails, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS`);
    console.log('======================================================\n');
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
    };
  }

  const fromAddress = process.env.SMTP_FROM || `"JobHunt App" <${process.env.SMTP_USER}>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - JobHunt</title>
      <style>
        body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        .container { max-width: 520px; margin: 36px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4c1d95, #7c3aed); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.85; }
        .content { padding: 32px 24px; text-align: center; }
        .greeting { font-size: 16px; color: #334155; margin-bottom: 12px; }
        .instruction { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
        .otp-box { background: #f5f3ff; border: 2px dashed #7c3aed; border-radius: 12px; padding: 18px 24px; display: inline-block; margin: 12px 0 24px; }
        .otp-code { font-size: 34px; font-weight: 800; color: #6d28d9; letter-spacing: 6px; font-family: monospace; }
        .expiry { font-size: 12px; color: #94a3b8; margin-top: 6px; }
        .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 JobHunt</h1>
          <p>Campus & Local Opportunities</p>
        </div>
        <div class="content">
          <p class="greeting">Hello,</p>
          <p class="instruction">
            Use the 6-digit verification code below to verify your email address on JobHunt.
          </p>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Expires in 10 minutes</div>
          </div>
          <p class="instruction">
            If you didn't request this verification code, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} JobHunt. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `Your JobHunt verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`;

  try {
    const info = await tx.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `🎯 JobHunt: Your verification code is ${otp}`,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[MAILER SUCCESS] 📧 Dispatched verification email to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true };
  } catch (error: any) {
    console.error(`[MAILER ERROR] Failed to send email to ${toEmail}:`, error?.message || error);
    return {
      sent: false,
      error: error?.message || 'Unknown email delivery error',
    };
  }
}
