import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding JobHunt database...');

  // Clear existing data
  await prisma.actionLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.savedJob.deleteMany();
  await prisma.application.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.adminUser.deleteMany();

  const hashedUserPw = await bcrypt.hash('password123', 10);
  const hashedAdminPw = await bcrypt.hash('admin123', 10);

  // 1. Create Admin
  const admin = await prisma.adminUser.create({
    data: {
      id: 'admin-1',
      email: 'admin@jobhunt.campus',
      passwordHash: hashedAdminPw,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
    },
  });

  // 2. Create Users
  const alex = await prisma.user.create({
    data: {
      id: 'user-1',
      name: 'Alex Johnson',
      email: 'alex@college.edu',
      passwordHash: hashedUserPw,
      phone: '+91 98765 43210',
      activeMode: 'SEEKER',
      isVerified: true,
      cancellationCount: 0,
      isBlocked: false,
      locationLat: 28.6139,
      locationLng: 77.2090,
      locationLabel: 'Delhi University Campus',
    },
  });

  const priya = await prisma.user.create({
    data: {
      id: 'user-2',
      name: 'Priya Sharma',
      email: 'priya@college.edu',
      passwordHash: hashedUserPw,
      phone: '+91 98765 11111',
      activeMode: 'RECRUITER',
      isVerified: true,
      locationLat: 28.6145,
      locationLng: 77.2085,
      locationLabel: 'Arts Faculty, Campus',
    },
  });

  const rohan = await prisma.user.create({
    data: {
      id: 'user-3',
      name: 'Rohan Verma',
      email: 'rohan@college.edu',
      passwordHash: hashedUserPw,
      phone: '+91 98765 22222',
      activeMode: 'RECRUITER',
      isVerified: true,
      locationLat: 28.6200,
      locationLng: 77.2100,
      locationLabel: 'Sports Complex',
    },
  });

  const sneha = await prisma.user.create({
    data: {
      id: 'user-4',
      name: 'Sneha Patel',
      email: 'sneha@college.edu',
      passwordHash: hashedUserPw,
      phone: '+91 98765 33333',
      activeMode: 'RECRUITER',
      isVerified: true,
      locationLat: 28.6139,
      locationLng: 77.2090,
      locationLabel: 'Incubation Centre',
    },
  });

  const drMehta = await prisma.user.create({
    data: {
      id: 'user-5',
      name: 'Dr. Mehta',
      email: 'mehta@college.edu',
      passwordHash: hashedUserPw,
      phone: '+91 98765 44444',
      activeMode: 'RECRUITER',
      isVerified: true,
      locationLat: 28.6130,
      locationLng: 77.2080,
      locationLabel: 'Central Library',
    },
  });

  const studentCouncil = await prisma.user.create({
    data: {
      id: 'user-6',
      name: 'Student Council',
      email: 'council@college.edu',
      passwordHash: hashedUserPw,
      phone: '+91 98765 55555',
      activeMode: 'RECRUITER',
      isVerified: true,
      locationLat: 28.6142,
      locationLng: 77.2092,
      locationLabel: 'Student Union Building',
    },
  });

  // Calculate dates
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const addDays = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return fmt(d);
  };

  // 3. Create Jobs
  const job1 = await prisma.job.create({
    data: {
      id: 'job-1',
      posterId: priya.id,
      type: 'SHORT_TERM',
      title: 'Event Setup Helper',
      description: 'Help set up tables, chairs and decorations for a college fest. No experience needed, just energy!',
      pay: 300,
      payUnit: 'FIXED',
      openings: 3,
      filledCount: 1,
      isRemote: false,
      locationLat: 28.6145,
      locationLng: 77.2085,
      locationLabel: 'Main Campus Gate, North Block',
      startDate: addDays(2),
      endDate: addDays(2),
      startTime: '09:00',
      endTime: '12:00',
      status: 'OPEN',
    },
  });

  const job2 = await prisma.job.create({
    data: {
      id: 'job-2',
      posterId: rohan.id,
      type: 'SHORT_TERM',
      title: 'Food Stall Assistant',
      description: 'Assist at a food stall during the annual sports day. Help with serving and cash handling.',
      pay: 150,
      payUnit: 'PER_HOUR',
      openings: 2,
      filledCount: 0,
      isRemote: false,
      locationLat: 28.6200,
      locationLng: 77.2100,
      locationLabel: 'Sports Complex Cafeteria',
      startDate: addDays(3),
      endDate: addDays(3),
      startTime: '10:00',
      endTime: '14:00',
      status: 'OPEN',
    },
  });

  const job3 = await prisma.job.create({
    data: {
      id: 'job-3',
      posterId: sneha.id,
      type: 'LONG_TERM',
      title: 'Remote Content Writer',
      description: 'Write blog posts, social media captions, and newsletters for a student startup. Flexible hours, fully remote.',
      pay: 8000,
      payUnit: 'PER_MONTH',
      openings: 1,
      filledCount: 0,
      isRemote: true,
      locationLat: 0,
      locationLng: 0,
      locationLabel: 'Remote',
      startDate: addDays(7),
      endDate: addDays(45),
      status: 'OPEN',
    },
  });

  const job4 = await prisma.job.create({
    data: {
      id: 'job-4',
      posterId: drMehta.id,
      type: 'SHORT_TERM',
      title: 'Library Digitization Assistant',
      description: 'Scan and catalogue old books and periodicals at the university library. Attention to detail required.',
      pay: 200,
      payUnit: 'PER_HOUR',
      openings: 2,
      filledCount: 0,
      isRemote: false,
      locationLat: 28.6130,
      locationLng: 77.2080,
      locationLabel: 'Central Library Room 204',
      startDate: addDays(1),
      endDate: addDays(1),
      startTime: '14:00',
      endTime: '17:00',
      status: 'OPEN',
    },
  });

  const job5 = await prisma.job.create({
    data: {
      id: 'job-5',
      posterId: studentCouncil.id,
      type: 'LONG_TERM',
      title: 'Campus Tutoring (Math & Physics)',
      description: 'Tutor first-year students in Mathematics and Physics. On-site sessions in the academic block.',
      pay: 500,
      payUnit: 'PER_HOUR',
      openings: 3,
      filledCount: 1,
      isRemote: false,
      locationLat: 28.6142,
      locationLng: 77.2092,
      locationLabel: 'Academic Block 3, Room 101',
      startDate: addDays(5),
      endDate: addDays(60),
      status: 'OPEN',
    },
  });

  // 4. Create Applications (Alex has accepted job-1)
  await prisma.application.create({
    data: {
      id: 'app-1',
      jobId: job1.id,
      seekerId: alex.id,
      status: 'ACCEPTED',
    },
  });

  // 4b. Create initial Chat Conversation for Job 1
  const conversation1 = await prisma.conversation.create({
    data: {
      id: 'conv-1',
      jobId: job1.id,
      seekerId: alex.id,
      recruiterId: priya.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        id: 'msg-1',
        conversationId: conversation1.id,
        senderId: priya.id,
        text: 'Hi Alex! Thanks for accepting the Event Setup Helper gig.',
      },
      {
        id: 'msg-2',
        conversationId: conversation1.id,
        senderId: alex.id,
        text: 'Hey Priya, happy to help! Should I bring gloves or work shoes?',
      },
      {
        id: 'msg-3',
        conversationId: conversation1.id,
        senderId: priya.id,
        text: 'Just comfortable shoes! We provide work gloves and refreshments. See you at Gate 3.',
      },
    ],
  });

  // 5. Create Saved Job (Alex saved job-3)
  await prisma.savedJob.create({
    data: {
      userId: alex.id,
      jobId: job3.id,
    },
  });

  // 6. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        id: 'notif-1',
        userId: alex.id,
        type: 'JOB_ACCEPTED',
        title: 'Application Confirmed!',
        body: 'You have successfully accepted "Event Setup Helper". Check My Jobs for details.',
        isRead: false,
        relatedJobId: job1.id,
      },
      {
        id: 'notif-2',
        userId: alex.id,
        type: 'REMINDER',
        title: 'Upcoming Job Reminder',
        body: 'Your job "Event Setup Helper" starts in 2 days at 9:00 AM. Be on time!',
        isRead: true,
        relatedJobId: job1.id,
      },
    ],
  });

  // 7. Create a Sample Report for Admin to review
  await prisma.report.create({
    data: {
      id: 'rep-1',
      targetType: 'JOB',
      targetId: job2.id,
      targetTitle: 'Food Stall Assistant',
      reporterId: alex.id,
      reason: 'SPAM',
      description: 'Listing seems duplicate of another post.',
      status: 'PENDING',
    },
  });

  // 8. Create Sample Action Log
  await prisma.actionLog.create({
    data: {
      id: 'log-1',
      adminId: admin.id,
      adminName: admin.name,
      action: 'LOGIN',
      targetType: 'SESSION',
      targetId: null,
      note: 'Admin session started',
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
