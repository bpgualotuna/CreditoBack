import { existsSync } from 'node:fs';
import { defineConfig } from 'prisma/config';

// Prisma 7 no longer loads `.env` automatically: load it natively when present.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Supabase / PostgreSQL connection string used by the Prisma CLI (migrate, studio, db pull).
    url: process.env.DATABASE_URL ?? '',
  },
});
