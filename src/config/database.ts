import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * Connects Prisma to PostgreSQL with automatic retry
 */
export async function connectPrismaWithRetry(maxRetries = 5, delayMs = 1000): Promise<void> {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Prisma connected to PostgreSQL successfully.');
      return;
    } catch (err: any) {
      if (i === maxRetries) {
        throw err;
      }
      console.log(`⏳ Waiting for PostgreSQL connection (attempt ${i}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
