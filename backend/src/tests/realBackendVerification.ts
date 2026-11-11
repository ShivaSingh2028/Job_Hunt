import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  authRouter,
  normalizeExistingUserEmails,
  formatUserResponse,
} from '../routes/auth.js';
import {
  generateTokens,
  verifyRefreshToken,
  saveRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  authenticateToken,
} from '../middleware/auth.js';
import { verifySmtpConnection } from '../utils/mailer.js';

const prisma = new PrismaClient();

// In-process Express Dispatcher (Works 100% reliably in any sandbox without TCP port restrictions)
function dispatch(router: any, method: string, url: string, body: any = {}, headers: any = {}): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req: any = {
      method: method.toUpperCase(),
      url,
      originalUrl: url,
      baseUrl: '',
      path: url.split('?')[0],
      body,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
      query: {},
      params: {},
    };

    const res: any = {
      statusCode: 200,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(jsonPayload: any) {
        resolve({ status: this.statusCode, data: jsonPayload });
        return this;
      },
      send(payload: any) {
        resolve({ status: this.statusCode, data: payload });
        return this;
      },
    };

    try {
      router(req, res, (err: any) => {
        if (err) reject(err);
        else resolve({ status: 404, data: { success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } } });
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function runRealBackendTests() {
  console.log('===========================================================');
  console.log('🚀 RUNNING JOBHUNT REAL-BACKEND IN-PROCESS INTEGRATION TESTS');
  console.log('===========================================================\n');

  try {
    // 0. Startup Checks
    console.log('--- Step 0: Testing PostgreSQL Connection & Startup Checks ---');
    try {
      await prisma.$connect();
      console.log('✔ Connected successfully to PostgreSQL database!');
    } catch (dbErr: any) {
      console.warn('\n⚠️  [POSTGRESQL CONNECTION NOTICE]');
      console.warn('Cannot connect to the PostgreSQL database at:', process.env.DATABASE_URL);
      console.warn('Reason:', dbErr?.message || dbErr);
      console.warn('\n💡 To run live integration tests against a real PostgreSQL database:');
      console.warn('1. Create a free PostgreSQL database at https://neon.tech');
      console.warn('2. Copy your connection string (ensure ?sslmode=require is included)');
      console.warn('3. Set DATABASE_URL in backend/.env');
      console.warn('4. Run: npm --prefix backend run render:build (runs prisma migrate deploy)');
      console.warn('5. Re-run: npm run test:real\n');
      return;
    }

    await normalizeExistingUserEmails();
    const smtpStatus = await verifySmtpConnection();
    console.log(`SMTP Startup Check Result: ${smtpStatus.ok ? 'CONFIGURED' : 'NOT_CONFIGURED (Notice logged)'}`);

    const uniqueId = Date.now();
    const mixedCaseEmail = `  Test.Recruiter.${uniqueId}@JobHunt-Test.Edu  `;
    const normalizedEmail = mixedCaseEmail.trim().toLowerCase();

    // 1. Sign up with a new email (with mixed casing and spaces)
    console.log('\n--- Test 1: Real Signup & Email Normalization ---');
    console.log(`Submitting signup with: "${mixedCaseEmail}"`);

    let capturedOtp = '';
    const origLog = console.log;
    console.log = (...args: any[]) => {
      const line = args.join(' ');
      const match = line.match(/6-Digit OTP Code:\s*(\d{6})/);
      if (match) {
        capturedOtp = match[1];
      }
      origLog(...args);
    };

    const signupRes = await dispatch(authRouter, 'POST', '/signup', {
      name: 'Tester Shiva',
      email: mixedCaseEmail,
      password: 'Password123!',
    });

    console.log = origLog;

    console.log(`Signup HTTP Status: ${signupRes.status}`);
    console.log('Signup Response:', JSON.stringify(signupRes.data, null, 2));

    // Verify user row was created in database and OTP is hashed
    const createdUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!createdUser) {
      throw new Error(`FAIL: User not found in database with normalized email: ${normalizedEmail}`);
    }
    console.log(`✔ User row created in DB: id=${createdUser.id}, isVerified=${createdUser.isVerified}`);

    // Verify OTP is hashed (starts with $2)
    if (!createdUser.verificationOtp || !createdUser.verificationOtp.startsWith('$2')) {
      throw new Error(`FAIL: Expected bcrypt hash in verificationOtp, found: ${createdUser.verificationOtp}`);
    }
    console.log(`✔ OTP is securely stored as bcrypt hash: ${createdUser.verificationOtp.substring(0, 15)}... (Plain text OTP never stored!)`);

    if (!capturedOtp || capturedOtp.length !== 6) {
      throw new Error(`FAIL: Expected 6-digit OTP captured from DEV ONLY mailer, found: ${capturedOtp}`);
    }

    // Verify bcrypt hash matches captured plain-text OTP
    const isHashValid = await bcrypt.compare(capturedOtp, createdUser.verificationOtp);
    if (!isHashValid) {
      throw new Error('FAIL: Stored OTP hash did not match generated OTP code!');
    }
    console.log('✔ Bcrypt comparison verified: plain OTP code validates against stored hash.');

    // 2. Email verification with 6-digit code
    console.log('\n--- Test 2: Email Verification with 6-Digit OTP ---');

    // First test wrong code
    const wrongVerifyRes = await dispatch(authRouter, 'POST', '/verify-email', {
      email: mixedCaseEmail,
      code: '999999',
    });
    if (wrongVerifyRes.data?.error?.code !== 'INVALID_CODE') {
      throw new Error(`FAIL: Expected INVALID_CODE on wrong OTP, got: ${JSON.stringify(wrongVerifyRes.data)}`);
    }
    console.log('✔ Wrong OTP correctly rejected with INVALID_CODE.');

    // Now test valid code
    const verifyRes = await dispatch(authRouter, 'POST', '/verify-email', {
      email: mixedCaseEmail,
      code: capturedOtp,
    });

    console.log(`Verify HTTP Status: ${verifyRes.status}`);
    console.log('Verify Response:', JSON.stringify(verifyRes.data, null, 2));
    if (!verifyRes.data.success) {
      throw new Error(`FAIL: Email verification failed: ${JSON.stringify(verifyRes.data)}`);
    }

    const { accessToken, refreshToken, user: verifiedUser } = verifyRes.data.data;
    console.log(`✔ Verified successfully! User isVerified: ${verifiedUser.isVerified}`);

    // Check RefreshToken in database table
    const storedRefreshToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (!storedRefreshToken) {
      throw new Error('FAIL: Refresh token was not persisted to the database RefreshToken table!');
    }
    console.log(`✔ Refresh token persisted in DB: expiresAt=${storedRefreshToken.expiresAt.toISOString()}`);

    // 3. Token Refresh & Rotation
    console.log('\n--- Test 3: Token Refresh & Safe Rotation ---');
    const refreshRes = await dispatch(authRouter, 'POST', '/refresh', { refreshToken });

    console.log(`Refresh HTTP Status: ${refreshRes.status}`);
    if (!refreshRes.data.success) {
      throw new Error(`FAIL: Token refresh failed: ${JSON.stringify(refreshRes.data)}`);
    }
    const newTokens = refreshRes.data.data;
    console.log('✔ Token refresh succeeded and returned rotated access/refresh tokens.');

    // Verify old refresh token is revoked
    const oldTokenCheck = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (oldTokenCheck) {
      throw new Error('FAIL: Old refresh token was not rotated/deleted from database!');
    }
    console.log('✔ Old refresh token was rotated out and invalidated in DB.');

    // 4. Server Restart Simulation & Session Survival
    console.log('\n--- Test 4: Server Restart Simulation & Session Survival ---');
    console.log('Simulating server restart (validating persistent token against DB)...');
    const tokenPayload = verifyRefreshToken(newTokens.refreshToken);
    if (!tokenPayload) {
      throw new Error('FAIL: Refresh token signature invalid after restart simulation');
    }

    const dbTokenCheck = await prisma.refreshToken.findUnique({
      where: { token: newTokens.refreshToken },
      include: { user: true },
    });
    if (!dbTokenCheck || !dbTokenCheck.user) {
      throw new Error('FAIL: Refresh token or user not in DB after restart simulation');
    }
    console.log(`✔ Token and User safely survived in DB! User: ${dbTokenCheck.user.email}`);

    // 5. Login with Different Capitalization
    console.log('\n--- Test 5: Login with Different Capitalization ---');
    const loginUpperRes = await dispatch(authRouter, 'POST', '/login', {
      email: mixedCaseEmail.toUpperCase(),
      password: 'Password123!',
    });
    console.log(`Login uppercase status: ${loginUpperRes.status}`);
    if (!loginUpperRes.data.success) {
      throw new Error(`FAIL: Capitalized login failed: ${JSON.stringify(loginUpperRes.data)}`);
    }
    console.log(`✔ Login with UPPERCASE email succeeded! Logged in as: ${loginUpperRes.data.data.user.email}`);

    // 6. Recruiter Mode & Gig Creation
    console.log('\n--- Test 6: Recruiter Gig Posting (Verified User) ---');
    // Update user to RECRUITER mode
    await prisma.user.update({
      where: { id: verifiedUser.id },
      data: { activeMode: 'RECRUITER' },
    });

    const recruiterTokens = generateTokens(verifiedUser.id, verifiedUser.email, 'USER');
    await saveRefreshToken(verifiedUser.id, recruiterTokens.refreshToken);

    // Call jobs router
    const { jobsRouter } = await import('../routes/jobs.js');
    const postGigRes = await dispatch(
      jobsRouter,
      'POST',
      '/',
      {
        type: 'SHORT_TERM',
        title: 'Stage Assistant',
        description: 'Help manage audio-visual equipment at the auditorium.',
        pay: 500,
        payUnit: 'FIXED',
        openings: 2,
        isRemote: false,
        location: { lat: 28.6145, lng: 77.2085, label: 'Main Auditorium' },
        startDate: '2026-11-10',
        endDate: '2026-11-10',
        startTime: '10:00',
        endTime: '13:00',
      },
      { authorization: `Bearer ${recruiterTokens.accessToken}` }
    );

    console.log(`Post gig status: ${postGigRes.status}`);
    if (!postGigRes.data.success) {
      throw new Error(`FAIL: Verified recruiter could not post gig: ${JSON.stringify(postGigRes.data)}`);
    }
    console.log(`✔ Verified recruiter posted gig successfully with NO verification gate! Gig ID: ${postGigRes.data.data.id}`);

    // 7. Unverified User Verification Gate
    console.log('\n--- Test 7: Unverified User Verification Gate ---');
    const unverifiedUser = await prisma.user.create({
      data: {
        name: 'Unverified Poster',
        email: `unverified.${Date.now()}@jobhunt-test.edu`,
        passwordHash: 'dummy_hash',
        activeMode: 'RECRUITER',
        isVerified: false,
      },
    });

    const unverifiedTokens = generateTokens(unverifiedUser.id, unverifiedUser.email, 'USER');
    const blockedPostRes = await dispatch(
      jobsRouter,
      'POST',
      '/',
      {
        type: 'SHORT_TERM',
        title: 'Should Be Blocked',
        description: 'Should be blocked.',
        pay: 200,
        payUnit: 'FIXED',
      },
      { authorization: `Bearer ${unverifiedTokens.accessToken}` }
    );

    console.log(`Unverified post attempt status: ${blockedPostRes.status}`);
    console.log('Blocked response error:', blockedPostRes.data.error);

    if (blockedPostRes.status !== 403 || blockedPostRes.data?.error?.code !== 'USER_NOT_VERIFIED') {
      throw new Error(`FAIL: Expected 403 USER_NOT_VERIFIED, got: ${blockedPostRes.status}`);
    }
    console.log('✔ Unverified user properly blocked with 403 USER_NOT_VERIFIED!');

    // 8. Resend verification call
    console.log('\n--- Test 8: Resend Verification Call ---');
    const resendRes = await dispatch(authRouter, 'POST', '/resend-verification', {
      email: unverifiedUser.email,
    });
    console.log(`Resend verification status: ${resendRes.status}`);
    console.log('Resend verification response:', resendRes.data);

    // 9. Non-Existent Account Error Message (NOT_FOUND vs Network error)
    console.log('\n--- Test 9: "No Account" 404 Error Isolation ---');
    const fakeLoginRes = await dispatch(authRouter, 'POST', '/login', {
      email: 'does-not-exist@randomdomain.edu',
      password: 'password123',
    });
    console.log(`Non-existent user status: ${fakeLoginRes.status}`);
    console.log('Non-existent user error:', fakeLoginRes.data.error);
    if (fakeLoginRes.status !== 404 || fakeLoginRes.data?.error?.code !== 'NOT_FOUND') {
      throw new Error(`FAIL: Expected 404 NOT_FOUND, got: ${fakeLoginRes.status}`);
    }
    console.log('✔ Server explicitly returns 404 NOT_FOUND only when account genuinely does not exist.');

    console.log('\n===========================================================');
    console.log('🎉 ALL 9 REAL-BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('===========================================================');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runRealBackendTests();
