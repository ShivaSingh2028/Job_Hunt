import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || process.argv[2] || '').trim().toLowerCase();
  const name = (process.env.ADMIN_NAME || process.argv[3] || 'Administrator').trim();
  const password = (process.env.ADMIN_PASSWORD || process.argv[4] || '').trim();

  console.log('\n======================================================');
  console.log('👤 JobHunt Secure Production Admin Setup');
  console.log('======================================================');

  if (!email || !email.includes('@')) {
    console.error('❌ Error: Valid ADMIN_EMAIL is required.');
    console.error('Usage: ADMIN_EMAIL="admin@yourdomain.com" ADMIN_NAME="Name" ADMIN_PASSWORD="your-strong-password" npm run create:admin');
    process.exit(1);
  }

  if (!password || password.length < 10) {
    console.error('❌ Error: ADMIN_PASSWORD must be at least 10 characters long.');
    console.error('Set it via the ADMIN_PASSWORD environment variable.');
    process.exit(1);
  }

  const lowerPw = password.toLowerCase();
  if (lowerPw.includes('admin123') || lowerPw.includes('password123')) {
    console.error('❌ Error: Insecure password. Default seed phrases ("admin123", "password123") are strictly prohibited.');
    process.exit(1);
  }

  console.log(`Setting up Super Admin for: ${email}`);
  console.log(`Display Name             : ${name}`);

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role: 'SUPER_ADMIN',
    },
    create: {
      email,
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log(`✅ Super Admin account "${admin.name}" (${admin.email}) successfully created/updated.`);
  console.log('Role: SUPER_ADMIN');
  console.log('======================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Failed to create admin account:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
