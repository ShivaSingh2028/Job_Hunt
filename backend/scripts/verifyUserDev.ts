import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

async function main() {
  if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
    console.error('❌ [DEV ONLY] Refusing to run verifyUserDev when NODE_ENV=production.');
    process.exit(1);
  }

  const rawEmail = process.argv[2];
  if (!rawEmail || !rawEmail.includes('@')) {
    console.error('Usage: npm run dev:verify-user -- <user-email>');
    process.exit(1);
  }

  const normalizedEmail = rawEmail.trim().toLowerCase();
  const prisma = new PrismaClient();

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true, isVerified: true },
    });

    if (!existing) {
      console.error(`❌ No user account found for: ${normalizedEmail}`);
      process.exit(1);
    }

    if (existing.isVerified) {
      console.log(`ℹ️ [DEV ONLY] User ${existing.email} (id=${existing.id}) is already verified.`);
      return;
    }

    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        isVerified: true,
        verificationOtp: null,
        verificationOtpExpiresAt: null,
      },
      select: { id: true, email: true, isVerified: true },
    });

    console.log(`✔ [DEV ONLY] Marked user ${updated.email} (id=${updated.id}) as verified (isVerified=${updated.isVerified}).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('❌ [DEV ONLY] Error verifying user:', err?.message || err);
  process.exit(1);
});
