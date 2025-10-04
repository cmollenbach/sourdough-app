// lib/prisma.ts - Singleton PrismaClient instance
// This ensures we only create one database connection pool

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
// https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handler
async function gracefulShutdown() {
  console.log('Closing database connections...');
  await prisma.$disconnect();
  console.log('Database connections closed.');
}

// Handle shutdown signals
process.on('SIGTERM', async () => {
  await gracefulShutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await gracefulShutdown();
  process.exit(0);
});

// Handle uncaught errors
process.on('beforeExit', async () => {
  await gracefulShutdown();
});

export default prisma;
