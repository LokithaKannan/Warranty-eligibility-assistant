import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';

let customerToken = '';
let customer2Token = '';
let reviewerToken = '';
let testPolicyId = '';

beforeAll(async () => {
  // Clean up any leftover test data from previous runs
  try {
    const oldUsers = await prisma.user.findMany({
      where: { username: { in: ['cl_customer', 'cl_customer2', 'cl_reviewer', 'claim_admin'] } },
    });
    const oldUserIds = oldUsers.map((u) => u.id);
    if (oldUserIds.length > 0) {
      const oldClaims = await prisma.claimCheck.findMany({ where: { userId: { in: oldUserIds } } });
      await prisma.claimReview.deleteMany({ where: { claimId: { in: oldClaims.map((c) => c.id) } } });
      await prisma.claimCheck.deleteMany({ where: { userId: { in: oldUserIds } } });
      const oldAdmin = oldUsers.find((u) => u.username === 'claim_admin');
      if (oldAdmin) {
        const oldPolicies = await prisma.policy.findMany({ where: { createdById: oldAdmin.id } });
        await prisma.policyClause.deleteMany({ where: { policyId: { in: oldPolicies.map((p) => p.id) } } });
        await prisma.policy.deleteMany({ where: { createdById: oldAdmin.id } });
      }
      await prisma.user.deleteMany({ where: { id: { in: oldUserIds } } });
    }
  } catch { /* ignore */ }

  const hash = await bcrypt.hash('ClaimTest123!', 10);
  const [c1, c2, rev, adm] = await Promise.all([
    prisma.user.create({ data: { username: 'cl_customer', email: 'clcust@test.com', passwordHash: hash, role: 'CUSTOMER', isActive: true } }),
    prisma.user.create({ data: { username: 'cl_customer2', email: 'clcust2@test.com', passwordHash: hash, role: 'CUSTOMER', isActive: true } }),
    prisma.user.create({ data: { username: 'cl_reviewer', email: 'clrev@test.com', passwordHash: hash, role: 'REVIEWER', isActive: true } }),
    prisma.user.create({ data: { username: 'claim_admin', email: 'cadm@test.com', passwordHash: hash, role: 'ADMIN', isActive: true } }),
  ]);

  const [c1Login, c2Login, rLogin] = await Promise.all([
    request(app).post('/api/auth/login').send({ username: 'cl_customer', password: 'ClaimTest123!' }),
    request(app).post('/api/auth/login').send({ username: 'cl_customer2', password: 'ClaimTest123!' }),
    request(app).post('/api/auth/login').send({ username: 'cl_reviewer', password: 'ClaimTest123!' }),
  ]);

  customerToken = c1Login.body.data.token;
  customer2Token = c2Login.body.data.token;
  reviewerToken = rLogin.body.data.token;

  // Create a confirmed test policy directly in DB
  const policy = await prisma.policy.create({
    data: {
      name: 'Test 12-Month Policy',
      productCategory: 'Electronics',
      manufacturerLabel: 'TestCo',
      durationMonths: 12,
      proofRequired: true,
      originalFilename: 'test.pdf',
      storedFilename: 'test-stored.pdf',
      fileHash: 'testhash-' + Date.now(),
      extractionStatus: 'EXTRACTED',
      isConfirmed: true,
      isActive: true,
      createdById: adm.id,
    },
  });

  await prisma.policyClause.createMany({
    data: [
      { policyId: policy.id, clauseType: 'WARRANTY_DURATION', clauseText: '12 months warranty.', pageNumber: 1, confirmedByReviewer: true },
      { policyId: policy.id, clauseType: 'PROOF_REQUIREMENT', clauseText: 'Proof of purchase required.', pageNumber: 1, confirmedByReviewer: true },
    ],
  });

  testPolicyId = policy.id;
});

afterAll(async () => {
  // Clean up test data in correct order
  try {
    const users = await prisma.user.findMany({ where: { username: { in: ['cl_customer', 'cl_customer2', 'cl_reviewer', 'claim_admin'] } } });
    const userIds = users.map((u) => u.id);
    // Delete reviews and claims first
    const claims = await prisma.claimCheck.findMany({ where: { userId: { in: userIds } } });
    const claimIds = claims.map((c) => c.id);
    await prisma.claimReview.deleteMany({ where: { claimId: { in: claimIds } } });
    await prisma.claimCheck.deleteMany({ where: { userId: { in: userIds } } });
    // Delete policies created by test admin
    const adminUser = users.find((u) => u.username === 'claim_admin');
    if (adminUser) {
      const policies = await prisma.policy.findMany({ where: { createdById: adminUser.id } });
      const policyIds = policies.map((p) => p.id);
      await prisma.policyClause.deleteMany({ where: { policyId: { in: policyIds } } });
      await prisma.policy.deleteMany({ where: { id: { in: policyIds } } });
    }
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  } catch (e) {
    // Best-effort cleanup
    console.warn('Cleanup error:', e);
  }
  await prisma.$disconnect();
});

describe('Claim Assessment API', () => {
  let savedReferenceCode = '';

  // Test 11: In-period claim with valid inputs
  it('POST /api/claims/check — returns MEETS_BASIC_CHECKS for valid in-period claim', async () => {
    const res = await request(app)
      .post('/api/claims/check')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        policyId: testPolicyId,
        productName: 'Test Headphones',
        productCategory: 'Electronics',
        purchaseDate: '2026-01-01',
        issueDate: '2026-06-01',
        issueType: 'MANUFACTURING_DEFECT',
        issueDescription: 'The device stopped working after normal use without any physical damage.',
        proofAvailable: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.assessment.preliminaryResult).toBe('MEETS_BASIC_CHECKS');
    expect(res.body.data.claim.referenceCode).toBeDefined();
    savedReferenceCode = res.body.data.claim.referenceCode;

    // Test 20: Verify claim persisted
    expect(res.body.data.claim.id).toBeDefined();
  });

  // Test 12: Expired warranty
  it('POST /api/claims/check — returns OUTSIDE_PERIOD for expired warranty', async () => {
    const res = await request(app)
      .post('/api/claims/check')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        policyId: testPolicyId,
        productName: 'Test Headphones',
        productCategory: 'Electronics',
        purchaseDate: '2025-01-01',
        issueDate: '2026-06-01', // 17 months after purchase; exceeds 12-month warranty
        issueType: 'BATTERY_FAILURE',
        issueDescription: 'Battery drains very quickly after one charge cycle.',
        proofAvailable: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.assessment.preliminaryResult).toBe('OUTSIDE_PERIOD');
  });

  // Test 14: Missing proof of purchase
  it('POST /api/claims/check — returns MISSING_INFO when proof unavailable', async () => {
    const res = await request(app)
      .post('/api/claims/check')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        policyId: testPolicyId,
        productName: 'Test Headphones',
        productCategory: 'Electronics',
        purchaseDate: '2026-01-01',
        issueDate: '2026-06-01',
        issueType: 'MANUFACTURING_DEFECT',
        issueDescription: 'Device does not power on at all.',
        proofAvailable: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.assessment.preliminaryResult).toBe('MISSING_INFO');
  });

  // Test 18: Customer cannot access another customer's claim
  it('GET /api/claims/:ref — customer2 cannot see customer1 claim', async () => {
    if (!savedReferenceCode) {
      console.warn('Skipping: no saved reference code');
      return;
    }

    const res = await request(app)
      .get(`/api/claims/${savedReferenceCode}`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(res.status).toBe(404);
  });

  // Reviewer can see all claims
  it('GET /api/claims — reviewer can list all claims', async () => {
    const res = await request(app)
      .get('/api/claims')
      .set('Authorization', `Bearer ${reviewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.data).toBeDefined();
    expect(typeof res.body.data.total).toBe('number');
  });

  // Unauthenticated user cannot create claim
  it('POST /api/claims/check — fails without auth', async () => {
    const res = await request(app)
      .post('/api/claims/check')
      .send({
        policyId: testPolicyId,
        productName: 'Test',
        productCategory: 'Electronics',
        purchaseDate: '2026-01-01',
        issueDate: '2026-06-01',
        issueType: 'MANUFACTURING_DEFECT',
        issueDescription: 'Description here with enough chars.',
        proofAvailable: true,
      });

    expect(res.status).toBe(401);
  });
});
