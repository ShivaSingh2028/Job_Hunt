import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_ADMIN_EMAILS = ['admin@jobhunt.campus'];
const DEMO_USER_EMAILS = [
  'alex@college.edu',
  'priya@college.edu',
  'rohan@college.edu',
  'sneha@college.edu',
  'mehta@college.edu',
  'council@college.edu',
];

async function main() {
  const isConfirmed = process.argv.includes('--confirm');

  console.log('\n======================================================');
  console.log('🧹 JobHunt Demo Account & Test Data Removal');
  console.log(`Mode: ${isConfirmed ? '🚨 LIVE EXECUTION (--confirm)' : '🔍 DRY RUN (Preview only)'}`);
  console.log('======================================================\n');

  // 1. Identify Demo Admin Accounts
  const demoAdmins = await prisma.adminUser.findMany({
    where: { email: { in: DEMO_ADMIN_EMAILS } },
    select: { id: true, email: true, name: true },
  });

  // 2. Identify Demo Users
  const demoUsers = await prisma.user.findMany({
    where: { email: { in: DEMO_USER_EMAILS } },
    select: { id: true, email: true, name: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);

  // 3. Identify Demo Jobs
  const demoJobs = await prisma.job.findMany({
    where: {
      OR: [
        { posterId: { in: demoUserIds } },
        { id: { in: ['job-1', 'job-2', 'job-3', 'job-4', 'job-5'] } },
      ],
    },
    select: { id: true, title: true },
  });
  const demoJobIds = demoJobs.map((j) => j.id);

  // 4. Count Related Dependent Records
  const appCount = await prisma.application.count({
    where: {
      OR: [
        { seekerId: { in: demoUserIds } },
        { jobId: { in: demoJobIds } },
      ],
    },
  });

  const convCount = await prisma.conversation.count({
    where: {
      OR: [
        { seekerId: { in: demoUserIds } },
        { recruiterId: { in: demoUserIds } },
        { jobId: { in: demoJobIds } },
      ],
    },
  });

  const msgCount = await prisma.message.count({
    where: {
      OR: [
        { senderId: { in: demoUserIds } },
        { conversation: { jobId: { in: demoJobIds } } },
      ],
    },
  });

  const notifCount = await prisma.notification.count({
    where: { userId: { in: demoUserIds } },
  });

  const savedJobCount = await prisma.savedJob.count({
    where: {
      OR: [
        { userId: { in: demoUserIds } },
        { jobId: { in: demoJobIds } },
      ],
    },
  });

  const repCount = await prisma.report.count({
    where: {
      OR: [
        { reporterId: { in: demoUserIds } },
        { targetId: { in: demoJobIds } },
        { targetId: { in: demoUserIds } },
      ],
    },
  });

  const demoAdminIds = demoAdmins.map((a) => a.id);
  const actionLogCount = await prisma.actionLog.count({
    where: { adminId: { in: demoAdminIds } },
  });

  console.log('📋 Audit Findings:');
  console.log(`• Demo Admin Accounts found: ${demoAdmins.length}`);
  demoAdmins.forEach((a) => console.log(`   - [Admin] ${a.name} (${a.email})`));

  console.log(`• Demo User Accounts found : ${demoUsers.length}`);
  demoUsers.forEach((u) => console.log(`   - [User]  ${u.name} (${u.email})`));

  console.log(`• Demo Jobs found          : ${demoJobs.length}`);
  demoJobs.forEach((j) => console.log(`   - [Job]   ${j.title} (ID: ${j.id})`));

  console.log('\n📊 Dependent Records Impact:');
  console.log(`• Applications             : ${appCount}`);
  console.log(`• Chat Conversations       : ${convCount}`);
  console.log(`• Chat Messages            : ${msgCount}`);
  console.log(`• Saved Jobs               : ${savedJobCount}`);
  console.log(`• Notifications            : ${notifCount}`);
  console.log(`• Dispute Reports          : ${repCount}`);
  console.log(`• Admin Action Logs        : ${actionLogCount}`);

  if (!isConfirmed) {
    console.log('\n------------------------------------------------------');
    console.log('🛡️  DRY RUN COMPLETE: No data was modified or deleted.');
    console.log('To permanently remove these accounts and their demo data, run:');
    console.log('npm --prefix backend run clean:demo -- --confirm');
    console.log('------------------------------------------------------\n');
    return;
  }

  // Live Deletion Execution
  console.log('\n⏳ Executing deletion in database transaction...');

  await prisma.$transaction(async (tx) => {
    // 1. Delete Reports involving demo data
    if (repCount > 0) {
      await tx.report.deleteMany({
        where: {
          OR: [
            { reporterId: { in: demoUserIds } },
            { targetId: { in: demoJobIds } },
            { targetId: { in: demoUserIds } },
          ],
        },
      });
    }

    // 2. Delete Action Logs
    if (actionLogCount > 0) {
      await tx.actionLog.deleteMany({
        where: { adminId: { in: demoAdminIds } },
      });
    }

    // 3. Delete Demo Jobs (cascades to Applications, SavedJobs, Conversations, Messages)
    if (demoJobIds.length > 0) {
      await tx.job.deleteMany({
        where: { id: { in: demoJobIds } },
      });
    }

    // 4. Delete Demo Users (cascades to any remaining user relations)
    if (demoUserIds.length > 0) {
      await tx.user.deleteMany({
        where: { id: { in: demoUserIds } },
      });
    }

    // 5. Delete Demo Admins
    if (demoAdminIds.length > 0) {
      await tx.adminUser.deleteMany({
        where: { id: { in: demoAdminIds } },
      });
    }
  });

  console.log('✅ All demo accounts and associated test data have been permanently removed.');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Deletion failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
