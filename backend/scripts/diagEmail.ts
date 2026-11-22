import dotenv from 'dotenv';
dotenv.config();

import { sendOtpEmail, verifyEmailProviderConnection } from '../src/utils/mailer.js';

async function runDiagnosis() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ [DIAG ERROR] npm run diag:email is strictly restricted to development environments.');
    process.exit(1);
  }

  const targetEmail = (process.argv[2] || process.env.EMAIL_FROM || 'singhshiva8454@gmail.com').trim().toLowerCase();
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();

  console.log('\n======================================================');
  console.log('🔍 JobHunt Email Delivery Diagnostic (Development Only)');
  console.log('======================================================');
  console.log(`Target Recipient : ${targetEmail}`);
  console.log(`Configured Provider: ${process.env.EMAIL_PROVIDER || 'smtp'}`);
  console.log(`Configured Sender  : ${process.env.EMAIL_FROM || 'not set'}`);
  console.log('------------------------------------------------------');

  // Step 1: Verify Connection & Credentials
  console.log('[Step 1/3] Verifying email provider connection...');
  const connCheck = await verifyEmailProviderConnection();
  if (!connCheck.ok) {
    console.error(`❌ Provider verification failed: ${connCheck.message}`);
    process.exit(1);
  }
  console.log('✅ Provider connection and sender verification passed.');

  // Step 2: Send Diagnostic OTP
  console.log('\n[Step 2/3] Dispatching diagnostic OTP email...');
  const sendResult = await sendOtpEmail(targetEmail, testOtp);
  if (!sendResult.sent) {
    console.error(`❌ Email dispatch failed!`);
    console.error(`Reason: ${sendResult.reason || 'UNKNOWN'}`);
    console.error(`Error : ${sendResult.error || 'None provided'}`);
    process.exit(1);
  }
  console.log(`✅ Dispatch request accepted by provider (${sendResult.provider}).`);

  // Step 3: Query Brevo Live Delivery Event (if using Brevo)
  if ((process.env.EMAIL_PROVIDER || '').toLowerCase() === 'brevo') {
    console.log('\n[Step 3/3] Polling Brevo live event logs for delivery status (waiting 4s)...');
    await new Promise((r) => setTimeout(r, 4000));

    const apiKey = process.env.BREVO_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(`https://api.brevo.com/v3/smtp/statistics/events?email=${encodeURIComponent(targetEmail)}&limit=5`, {
          headers: {
            'api-key': apiKey,
            'Accept': 'application/json',
          },
        });

        if (res.ok) {
          const data: any = await res.json();
          const events: any[] = data?.events || [];
          if (events.length > 0) {
            console.log(`\n📬 Latest Brevo Events for ${targetEmail}:`);
            events.slice(0, 3).forEach((ev, idx) => {
              console.log(`  [${idx + 1}] Event: ${ev.event.toUpperCase()} | Time: ${ev.date}`);
              if (ev.reason) {
                console.log(`      Reason / Details: ${ev.reason}`);
              }
            });
            const topEvent = events[0].event;
            if (topEvent === 'delivered' || topEvent === 'opened') {
              console.log('\n🎉 SUCCESS: The email has been confirmed DELIVERED by the Brevo mail relay.');
            } else if (topEvent === 'requests') {
              console.log('\n⏳ PENDING: Brevo accepted the message and is handing it off to the destination mailbox.');
            } else if (topEvent === 'hardBounces' || topEvent === 'softBounces') {
              console.log('\n⚠️ BOUNCED: The recipient mail server rejected the email.');
            }
          } else {
            console.log('ℹ️ No event logged yet in Brevo statistics. Mail server may still be processing queue.');
          }
        } else {
          console.warn(`⚠️ Could not query Brevo event statistics (HTTP ${res.status}).`);
        }
      } catch (err: any) {
        console.warn(`⚠️ Failed to fetch Brevo events: ${err?.message || err}`);
      }
    }
  }

  console.log('======================================================\n');
}

runDiagnosis().catch((err) => {
  console.error('[DIAG FATAL ERROR]', err);
  process.exit(1);
});
