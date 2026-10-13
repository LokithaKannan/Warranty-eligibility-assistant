import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// Load .env manually so it works without dotenv package
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    }
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(32).default('change-this-secret-in-production-must-be-long'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  UPLOAD_MAX_SIZE_MB: z.string().default('10'),
  UPLOAD_MAX_PAGES: z.string().default('100'),
  UPLOADS_DIR: z.string().default('./uploads'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  ADMIN_SETUP_TOKEN: z.string().default('setup-admin-token-change-in-production'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.format());
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PORT: parseInt(parsed.data.PORT, 10),
  UPLOAD_MAX_SIZE_BYTES: parseInt(parsed.data.UPLOAD_MAX_SIZE_MB, 10) * 1024 * 1024,
  UPLOAD_MAX_PAGES: parseInt(parsed.data.UPLOAD_MAX_PAGES, 10),
};
