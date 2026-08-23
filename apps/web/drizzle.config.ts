import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/server/schema.ts',
  out: '../../drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://erilog:erilog_dev@localhost:5432/erilog',
  },
});
