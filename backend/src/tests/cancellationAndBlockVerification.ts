import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });
dotenv.config();

import express from 'express';
import http from 'http';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { authRouter } from '../routes/auth.js';
import { usersRouter } from '../routes/users.js';
import { jobsRouter } from '../routes/jobs.js';
import { generateTokens } from '../middleware/auth.js';

const TEST_PREFIX = 'test_fix_' + Date.now();
const RECRUITER_EMAIL = `${TEST_PREFIX}_recruiter@test.edu`;
const SEEKER_EMAIL = `${TEST_PREFIX}_seeker@test.edu`;

async function cleanup() {
  const testUsers = await prisma.user.findMany({
    where: { email: { contains: 'test_fix_' } },
    select: { id: true },
  });

  const userIds = testUsers.map((u) => u.id);
  if (userIds.length > 0) {
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.application.deleteMany({ where: { seekerId: { in: userIds } } });
    await prisma.job.deleteMany({ where: { posterId: { in: userIds } } });
    await prisma.refreshToken.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }
}

export async function runCancellationAndBlockTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING CANCELLATION & BLOCK VERIFICATION TESTS');
  console.log('====================================================');

  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', usersRouter);
  app.use('/api/v1/jobs', jobsRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  try {
    await cleanup();

    const passwordHash = await bcrypt.hash('Password123!', 10);

    const recruiter = await prisma.user.create({
      data: {
        name: 'Fix Recruiter',
        email: RECRUITER_EMAIL,
        passwordHash,
        isVerified: true,
        activeMode: 'RECRUITER',
      },
    });

    const seeker = await prisma.user.create({
      data: {
        name: 'Fix Seeker',
        email: SEEKER_EMAIL,
        passwordHash,
        isVerified: true,
        activeMode: 'SEEKER',
      },
    });

    const recruiterTokens = generateTokens(recruiter.id, recruiter.email, 'USER');
    const seekerTokens = generateTokens(seeker.id, seeker.email, 'USER');

    const authHeaders = (token: string) => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    async function api(path: string, options: any = {}) {
      const res = await fetch(`${baseUrl}${path}`, options);
      const json: any = await res.json().catch(() => null);
      return { status: res.status, ok: res.ok, body: json };
    }

    const jobPayload = (title: string) => ({
      title,
      description: 'Test job description',
      type: 'SHORT_TERM',
      pay: 50,
      payUnit: 'FIXED',
      openings: 1,
      isRemote: true,
      startDate: '2026-12-01',
      startTime: '10:00',
      endTime: '12:00',
    });

    // -------------------------------------------------------------------------
    // TEST 1: Recruiter strike on gig with accepted seekers
    // -------------------------------------------------------------------------
    console.log('\n--- Test 1: Recruiter strike on gig with accepted seekers ---');
    const job1Res = await api('/jobs', {
      method: 'POST',
      headers: authHeaders(recruiterTokens.accessToken),
      body: JSON.stringify(jobPayload('Gig with Seeker')),
    });
    const job1Id = job1Res.body.data.id;

    // Seeker accepts gig
    await prisma.application.create({
      data: {
        jobId: job1Id,
        seekerId: seeker.id,
        status: 'ACCEPTED',
      },
    });
    await prisma.job.update({
      where: { id: job1Id },
      data: { filledCount: 1, status: 'FILLED' },
    });

    // Recruiter cancels the gig
    const deleteJob1Res = await api(`/jobs/${job1Id}`, {
      method: 'DELETE',
      headers: authHeaders(recruiterTokens.accessToken),
    });
    console.log(`Delete Job 1 response (${deleteJob1Res.status}):`, deleteJob1Res.body);

    const recruiterAfterTest1 = await prisma.user.findUnique({ where: { id: recruiter.id } });
    const seekerNotif = await prisma.notification.findFirst({
      where: { userId: seeker.id, relatedJobId: job1Id, type: 'RECRUITER_CANCELLED' },
    });
    const appAfterTest1 = await prisma.application.findFirst({
      where: { jobId: job1Id, seekerId: seeker.id },
    });

    if (recruiterAfterTest1?.cancellationCount !== 1) {
      throw new Error(`FAIL Test 1: Expected recruiter strike count 1, got ${recruiterAfterTest1?.cancellationCount}`);
    }
    if (!seekerNotif) {
      throw new Error('FAIL Test 1: Seeker did not receive RECRUITER_CANCELLED notification');
    }
    if (appAfterTest1?.status !== 'CANCELLED' || !appAfterTest1.cancelledAt) {
      throw new Error('FAIL Test 1: Application status was not updated to CANCELLED with cancelledAt');
    }
    console.log('✔ Test 1 PASSED: Recruiter received 1 strike, seeker notified, application marked cancelled.');

    // -------------------------------------------------------------------------
    // TEST 2: No strike on open gig (no accepted seekers)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: No strike on open gig without accepted seekers ---');
    const job2Res = await api('/jobs', {
      method: 'POST',
      headers: authHeaders(recruiterTokens.accessToken),
      body: JSON.stringify(jobPayload('Open Gig No Seekers')),
    });
    const job2Id = job2Res.body.data.id;

    const deleteJob2Res = await api(`/jobs/${job2Id}`, {
      method: 'DELETE',
      headers: authHeaders(recruiterTokens.accessToken),
    });
    console.log(`Delete Job 2 response (${deleteJob2Res.status}):`, deleteJob2Res.body);

    const recruiterAfterTest2 = await prisma.user.findUnique({ where: { id: recruiter.id } });
    if (recruiterAfterTest2?.cancellationCount !== 1) {
      throw new Error(`FAIL Test 2: Recruiter strike count should remain 1, got ${recruiterAfterTest2?.cancellationCount}`);
    }
    console.log('✔ Test 2 PASSED: Recruiter strike count remained unchanged (no penalty on open gig).');

    // -------------------------------------------------------------------------
    // TEST 3: 3rd strike blocking recruiter
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: 3rd strike triggers 24h block and resets count ---');
    // Set recruiter cancellationCount to 2
    await prisma.user.update({
      where: { id: recruiter.id },
      data: { cancellationCount: 2 },
    });

    const job3Res = await api('/jobs', {
      method: 'POST',
      headers: authHeaders(recruiterTokens.accessToken),
      body: JSON.stringify(jobPayload('Gig for 3rd Strike')),
    });
    const job3Id = job3Res.body.data.id;

    await prisma.application.create({
      data: {
        jobId: job3Id,
        seekerId: seeker.id,
        status: 'ACCEPTED',
      },
    });
    await prisma.job.update({
      where: { id: job3Id },
      data: { filledCount: 1, status: 'FILLED' },
    });

    const deleteJob3Res = await api(`/jobs/${job3Id}`, {
      method: 'DELETE',
      headers: authHeaders(recruiterTokens.accessToken),
    });
    console.log(`Delete Job 3 response (${deleteJob3Res.status}):`, deleteJob3Res.body);

    const recruiterAfterTest3 = await prisma.user.findUnique({ where: { id: recruiter.id } });
    const blockNotif = await prisma.notification.findFirst({
      where: { userId: recruiter.id, type: 'BLOCKED' },
    });

    if (!recruiterAfterTest3?.isBlocked || !recruiterAfterTest3.blockedUntil) {
      throw new Error('FAIL Test 3: Recruiter is not marked blocked with blockedUntil');
    }
    if (recruiterAfterTest3.cancellationCount !== 0) {
      throw new Error(`FAIL Test 3: Expected cancellationCount reset to 0, got ${recruiterAfterTest3.cancellationCount}`);
    }
    if (!blockNotif) {
      throw new Error('FAIL Test 3: BLOCKED notification not created for recruiter');
    }
    console.log('✔ Test 3 PASSED: 3rd strike reset count to 0, set blockedUntil ~24h, and created BLOCKED notification.');

    // -------------------------------------------------------------------------
    // TEST 4: Blocked user can log in successfully (200 OK)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: Blocked user logs in normally (200 OK) ---');
    const loginRes = await api('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: RECRUITER_EMAIL,
        password: 'Password123!',
      }),
    });
    console.log(`Login response status (${loginRes.status}):`, loginRes.body);

    if (loginRes.status !== 200 || !loginRes.body.success) {
      throw new Error(`FAIL Test 4: Blocked user login failed with status ${loginRes.status}`);
    }
    if (!loginRes.body.data.user.isBlocked || !loginRes.body.data.user.blockedUntil) {
      throw new Error('FAIL Test 4: Login response user does not reflect isBlocked and blockedUntil');
    }
    console.log('✔ Test 4 PASSED: Blocked user logged in with 200 OK, returning isBlocked and blockedUntil.');

    // -------------------------------------------------------------------------
    // TEST 5: Blocked user gets 403 USER_BLOCKED on post and accept
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: Blocked user gets 403 USER_BLOCKED on post and accept ---');
    const activeRecruiterToken = loginRes.body.data.accessToken;

    // Attempt to post gig while blocked
    const postBlockedRes = await api('/jobs', {
      method: 'POST',
      headers: authHeaders(activeRecruiterToken),
      body: JSON.stringify(jobPayload('Should Be Rejected')),
    });
    console.log(`Post gig while blocked (${postBlockedRes.status}):`, postBlockedRes.body);

    if (postBlockedRes.status !== 403 || postBlockedRes.body.error?.code !== 'USER_BLOCKED') {
      throw new Error(`FAIL Test 5: Expected 403 USER_BLOCKED on post, got ${postBlockedRes.status}`);
    }
    if (!postBlockedRes.body.error?.blockedUntil) {
      throw new Error('FAIL Test 5: USER_BLOCKED error response missing blockedUntil field');
    }

    // Set seeker to blocked to test accept
    await prisma.user.update({
      where: { id: seeker.id },
      data: { isBlocked: true, blockedUntil: new Date(Date.now() + 86400000) },
    });

    // Create an open gig as unblocked recruiter
    await prisma.user.update({
      where: { id: recruiter.id },
      data: { isBlocked: false, blockedUntil: null },
    });
    const openJobRes = await api('/jobs', {
      method: 'POST',
      headers: authHeaders(activeRecruiterToken),
      body: JSON.stringify(jobPayload('Open Job for Blocked Seeker')),
    });
    const openJobId = openJobRes.body.data.id;

    // Attempt to accept gig while blocked
    const acceptBlockedRes = await api(`/jobs/${openJobId}/accept`, {
      method: 'POST',
      headers: authHeaders(seekerTokens.accessToken),
    });
    console.log(`Accept gig while blocked (${acceptBlockedRes.status}):`, acceptBlockedRes.body);

    if (acceptBlockedRes.status !== 403 || acceptBlockedRes.body.error?.code !== 'USER_BLOCKED') {
      throw new Error(`FAIL Test 5: Expected 403 USER_BLOCKED on accept, got ${acceptBlockedRes.status}`);
    }
    if (!acceptBlockedRes.body.error?.blockedUntil) {
      throw new Error('FAIL Test 5: USER_BLOCKED error response on accept missing blockedUntil field');
    }

    // View gigs while blocked should succeed (200 OK)
    const viewGigsRes = await api('/jobs', {
      method: 'GET',
      headers: authHeaders(seekerTokens.accessToken),
    });
    if (viewGigsRes.status !== 200) {
      throw new Error(`FAIL Test 5: Viewing gigs while blocked returned ${viewGigsRes.status}`);
    }
    console.log('✔ Test 5 PASSED: Post & accept return 403 USER_BLOCKED with blockedUntil; viewing gigs returns 200.');

    // -------------------------------------------------------------------------
    // TEST 6: Automatic unblocking after time passes (past timestamp)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: Automatic unblocking after block time passes ---');
    // Set seeker's blockedUntil to 1 minute in the past
    await prisma.user.update({
      where: { id: seeker.id },
      data: {
        isBlocked: true,
        blockedUntil: new Date(Date.now() - 60000),
      },
    });

    // Check GET /users/me automatically clears block
    const getMeRes = await api('/users/me', {
      method: 'GET',
      headers: authHeaders(seekerTokens.accessToken),
    });
    console.log(`GET /users/me after time passed (${getMeRes.status}): isBlocked=${getMeRes.body.data?.isBlocked}, blockedUntil=${getMeRes.body.data?.blockedUntil}`);

    if (getMeRes.body.data?.isBlocked !== false || getMeRes.body.data?.blockedUntil !== null) {
      throw new Error('FAIL Test 6: GET /users/me did not clear expired block');
    }

    const seekerInDb = await prisma.user.findUnique({ where: { id: seeker.id } });
    if (seekerInDb?.isBlocked !== false || seekerInDb.blockedUntil !== null) {
      throw new Error('FAIL Test 6: Database was not updated to clear expired block');
    }

    console.log('✔ Test 6 PASSED: Expired block cleared dynamically and user automatically unblocked.');
    console.log('\n====================================================');
    console.log('🎉 ALL CANCELLATION & BLOCK TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } finally {
    console.log('\n--- CLEANING UP TEST DATA ---');
    await cleanup();
    server.close();
    await prisma.$disconnect();
    console.log('--- CLEANUP COMPLETE ---');
  }
}

// Allow direct CLI execution
if (process.argv[1]?.includes('cancellationAndBlockVerification')) {
  runCancellationAndBlockTests().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });
}
