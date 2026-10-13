// Set test environment variables before any imports
// Use dev.db so the Prisma singleton (already initialized with dev.db) works correctly
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./dev.db';
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-minimum-32-chars';
process.env.JWT_EXPIRES_IN = '1h';
process.env.UPLOAD_MAX_SIZE_MB = '10';
process.env.UPLOAD_MAX_PAGES = '100';
process.env.UPLOADS_DIR = './uploads';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.ADMIN_SETUP_TOKEN = 'test-setup-token';

// Ensure uploads directories exist
import fs from 'fs';
for (const d of ['./uploads', './uploads-test']) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}
