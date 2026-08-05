import { PrismaClient } from "@prisma/client";

// Why this weird global trick? Next.js reloads code a lot during
// development. Without this, it would open a NEW database connection
// every time you save a file, and eventually crash from too many
// connections. This keeps ONE connection reused everywhere.
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;