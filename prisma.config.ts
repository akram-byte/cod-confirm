import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, studio, seed) uses the direct (non-pooled) URL when set.
// The app itself uses DATABASE_URL (pooled) through the pg driver adapter.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
