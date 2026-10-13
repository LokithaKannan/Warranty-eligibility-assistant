import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';

beforeAll(async () => {
  // Create test users in dev.db
  const hash = await bcrypt.hash('TestPassword123!', 10);
  await prisma.user.deleteMany({ where: { username: { in: ['testadmin', 'testcustomer'] } } });
  await prisma.user.createMany({
    data: [
      {
        username: 'testadmin',
        email: 'testadmin@test.com',
        passwordHash: hash,
        role: 'ADMIN',
        isActive: true,
      },
      {
        username: 'testcustomer',
        email: 'testcustomer@test.com',
        passwordHash: hash,
        role: 'CUSTOMER',
        isActive: true,
      },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: { in: ['testadmin', 'testcustomer'] } } });
  await prisma.$disconnect();
});

describe('Authentication API', () => {
  // Test 1: Successful login
  it('POST /api/auth/login — succeeds with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'TestPassword123!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('testadmin');
    expect(res.body.data.user.role).toBe('ADMIN');
    // Password hash must NOT be returned
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  // Test 2: Login with incorrect password
  it('POST /api/auth/login — fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeUndefined();
  });

  // Login with non-existent user
  it('POST /api/auth/login — fails for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'anything' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // GET /me with valid token
  it('GET /api/auth/me — returns user with valid token', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'TestPassword123!' });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('testadmin');
  });

  // GET /me without token
  it('GET /api/auth/me — returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('Authorization', () => {
  // Test 3: Customer cannot access admin endpoint
  it('GET /api/admin/audit-logs — denied for customer role', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testcustomer', password: 'TestPassword123!' });

    const token = loginRes.body.data.token;

    const res = await request(app)
      .get('/api/admin/audit-logs')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // Test 19: Unauthorized user cannot access audit logs
  it('GET /api/admin/audit-logs — denied without auth', async () => {
    const res = await request(app).get('/api/admin/audit-logs');
    expect(res.status).toBe(401);
  });
});

describe('Health Check', () => {
  it('GET /api/health — returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('healthy');
  });
});
