import dns from 'dns';
import { PrismaClient } from '@prisma/client';

// Ensure IPv4 resolution first on Windows/dual-stack networks to prevent hangs to external database servers
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

export const prisma = new PrismaClient({
  log: ['warn', 'error'],
});
