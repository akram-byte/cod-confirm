import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  // Keep idle connections for a minute (a new TLS connection to Neon costs several round
  // trips; pg's default is 10s), but well under Neon's 5-minute sleep: a connection kept
  // across a sleep is dead and the next query hangs until ETIMEDOUT.
  // keepAlive + a connect timeout make a dropped connection fail fast instead.
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString, idleTimeoutMillis: 60_000, keepAlive: true, connectionTimeoutMillis: 10_000 }),
  });
}

// Reuse one client in development (hot reload would otherwise open many connections).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
