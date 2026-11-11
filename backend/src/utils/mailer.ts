import nodemailer from 'nodemailer';

interface SendMailResult {
  sent: boolean;
  provider?: string;
  reason?: string;
  error?: string;
}

type MailTransporter = ReturnType<typeof nodemailer.createTransport>;

let transporter: MailTransporter | null = null;

// Helper to log OTP in dev mode only when email delivery fails
function logDevOnlyOtp(toEmail: string, otp: string, reason: string) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n======================================================');
    console.log('⚠️  [DEV ONLY] Verification email could not be dispatched.');
    console.log(`[DEV ONLY] Recipient: ${toEmail}`);
    console.log(`[DEV ONLY] 6-Digit OTP Code: ${otp}`);
    console.log(`[DEV ONLY] Reason: ${reason}`);
    console.log('[DEV ONLY] (Notice: This output is strictly disabled in production)');
    console.log('======================================================\n');
  }
}

export function getTransporter(): MailTransporter | null {
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

export async function verifyEmailProviderConnection(): Promise<{ ok: boolean; message: string }> {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();

  if (provider === 'resend') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      const msg = '[EMAIL PROVIDER NOTICE] EMAIL_PROVIDER=resend, but RESEND_API_KEY is not set. Emails cannot be delivered.';
      console.warn(msg);
      return { ok: false, message: msg };
    }
    const msg = '[EMAIL PROVIDER OK] Configured with Resend HTTPS API (Port 443 - firewall safe).';
    console.log(msg);
    return { ok: true, message: msg };
  }

  if (provider === 'brevo') {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      const msg = '[EMAIL PROVIDER NOTICE] EMAIL_PROVIDER=brevo, but BREVO_API_KEY is not set. Emails cannot be delivered.';
      console.warn(msg);
      return { ok: false, message: msg };
    }
    const msg = '[EMAIL PROVIDER OK] Configured with Brevo HTTPS API (Port 443 - firewall safe).';
    console.log(msg);
    return { ok: true, message: msg };
  }

  // Default: SMTP
  const tx = getTransporter();
  if (!tx) {
    const msg = '[SMTP NOTICE] SMTP credentials not set in environment (SMTP_HOST/USER/PASS). Real emails will NOT be delivered until configured.';
    console.warn(msg);
    return { ok: false, message: msg };
  }

  try {
    await tx.verify();
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = process.env.SMTP_PORT || '587';
    const msg = `[SMTP OK] Server connected and verified with SMTP server (${host}:${port}). Ready to deliver verification emails.`;
    console.log(msg);
    return { ok: true, message: msg };
  } catch (err: any) {
    const msg = `[SMTP FAILURE] Failed to connect to SMTP server: ${err?.message || err}`;
    console.error(msg);
    return { ok: false, message: msg };
  }
}

// Backward-compatible alias
export const verifySmtpConnection = verifyEmailProviderConnection;

// Send via Resend HTTPS REST API (Port 443)
async function sendViaResend(toEmail: string, otp: string, subject: string, htmlContent: string, textContent: string): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const errorMsg = 'RESEND_API_KEY is not configured on backend.';
    logDevOnlyOtp(toEmail, otp, errorMsg);
    return { sent: false, provider: 'resend', error: errorMsg };
  }

  const from = process.env.RESEND_FROM || process.env.SMTP_FROM || 'JobHunt <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject,
        html: htmlContent,
        text: textContent,
      }),
    });

    const data: any = await res.json().catch(() => null);

    if (!res.ok) {
      const err = data?.message || `Resend API returned status ${res.status}`;
      logDevOnlyOtp(toEmail, otp, err);
      return { sent: false, provider: 'resend', error: err };
    }

    console.log(`[RESEND SUCCESS] 📧 Dispatched verification email to ${toEmail}. Id: ${data?.id}`);
    return { sent: true, provider: 'resend' };
  } catch (netErr: any) {
    logDevOnlyOtp(toEmail, otp, netErr?.message || 'HTTPS request failed');
    return { sent: false, provider: 'resend', error: netErr?.message || 'HTTPS request to Resend failed' };
  }
}

// Send via Brevo HTTPS REST API (Port 443)
async function sendViaBrevo(toEmail: string, otp: string, subject: string, htmlContent: string, textContent: string): Promise<SendMailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    const errorMsg = 'BREVO_API_KEY is not configured on backend.';
    logDevOnlyOtp(toEmail, otp, errorMsg);
    return { sent: false, provider: 'brevo', error: errorMsg };
  }

  const senderEmail = process.env.SMTP_USER || process.env.BREVO_SENDER || 'no-reply@jobhunt.app';
  const senderName = 'JobHunt App';

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
        textContent,
      }),
    });

    const data: any = await res.json().catch(() => null);

    if (!res.ok) {
      const err = data?.message || `Brevo API returned status ${res.status}`;
      logDevOnlyOtp(toEmail, otp, err);
      return { sent: false, provider: 'brevo', error: err };
    }

    console.log(`[BREVO SUCCESS] 📧 Dispatched verification email to ${toEmail}. MessageId: ${data?.messageId}`);
    return { sent: true, provider: 'brevo' };
  } catch (netErr: any) {
    logDevOnlyOtp(toEmail, otp, netErr?.message || 'HTTPS request failed');
    return { sent: false, provider: 'brevo', error: netErr?.message || 'HTTPS request to Brevo failed' };
  }
}

// Main Email Dispatch Function
export async function sendOtpEmail(toEmail: string, otp: string): Promise<SendMailResult> {
  const provider = (process.env.EMAIL_PROVIDER || 'smtp').toLowerCase();

  const subject = `🎯 JobHunt: Your verification code is ${otp}`;
  const textContent = `Your JobHunt verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`;
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

  // Route according to EMAIL_PROVIDER
  if (provider === 'resend') {
    return await sendViaResend(toEmail, otp, subject, htmlContent, textContent);
  }

  if (provider === 'brevo') {
    return await sendViaBrevo(toEmail, otp, subject, htmlContent, textContent);
  }

  // Default: SMTP
  const tx = getTransporter();

  if (!tx) {
    const errorMsg = 'SMTP credentials not configured on backend (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS).';
    logDevOnlyOtp(toEmail, otp, errorMsg);
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
      error: errorMsg,
    };
  }

  const fromAddress = process.env.SMTP_FROM || `"JobHunt App" <${process.env.SMTP_USER}>`;

  try {
    const info = await tx.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });

    console.log(`[SMTP SUCCESS] 📧 Dispatched verification email to ${toEmail}. MessageId: ${info.messageId}`);
    return { sent: true, provider: 'smtp' };
  } catch (error: any) {
    console.error(`[SMTP ERROR] Failed to send email to ${toEmail}:`, error?.message || error);
    logDevOnlyOtp(toEmail, otp, error?.message || 'SMTP delivery failed');
    return {
      sent: false,
      provider: 'smtp',
      error: error?.message || 'Unknown email delivery error',
    };
  }
}
