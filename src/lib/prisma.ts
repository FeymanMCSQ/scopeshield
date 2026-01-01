// src/lib/prisma.ts

import { PrismaClient } from '../generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // If you're using Accelerate, your DATABASE_URL will be prisma+postgres://...
    accelerateUrl: process.env.DATABASE_URL!,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
