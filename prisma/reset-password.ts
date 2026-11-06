/**
 * Sets the owner password to OWNER_PASSWORD from .env (for when the owner forgets it).
 * Every signed-in device is signed out.
 *
 *   npm run reset-password
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL! }),
});

async function main() {
  const password = process.env.OWNER_PASSWORD;
  if (!password || password.length < 8) throw new Error("Set OWNER_PASSWORD (min 8 characters) in .env first.");
  const passwordHash = await bcrypt.hash(password, 12);
  await db.settings.upsert({ where: { id: 1 }, update: { passwordHash }, create: { id: 1, passwordHash } });
  console.log("✓ Owner password reset from OWNER_PASSWORD. All devices are signed out.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
