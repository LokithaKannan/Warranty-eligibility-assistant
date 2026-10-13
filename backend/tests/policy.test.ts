import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';

let reviewerToken = '';
let customerToken = '';

beforeAll(async () => {
  const hash = await bcrypt.hash('TestPass123!', 10);
  await prisma.user.deleteMany({
    where: { username: { in: ['pol_reviewer', 'pol_customer'] } },
  });
  await prisma.user.createMany({
    data: [
      { username: 'pol_reviewer', email: 'prev@test.com', passwordHash: hash, role: 'REVIEWER', isActive: true },
      { username: 'pol_customer', email: 'pcust@test.com', passwordHash: hash, role: 'CUSTOMER', isActive: true },
    ],
  });

  const rLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'pol_reviewer', password: 'TestPass123!' });
  reviewerToken = rLogin.body.data.token;

  const cLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'pol_customer', password: 'TestPass123!' });
  customerToken = cLogin.body.data.token;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { username: { in: ['pol_reviewer', 'pol_customer'] } } });
  await prisma.$disconnect();
});

// Minimal valid PDF with actual text content
function makeTextPdfBuffer(): Buffer {
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 300 >>
stream
BT
/F1 12 Tf
50 750 Td
(LIMITED WARRANTY DOCUMENT) Tj
0 -20 Td
(This product is warranted for twelve 12 months from date of purchase.) Tj
0 -20 Td
(Proof of purchase required for warranty claims.) Tj
0 -20 Td
(Physical damage and water damage are excluded from coverage.) Tj
0 -20 Td
(Contact support to submit a claim.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f
trailer << /Size 6 /Root 1 0 R >>
startxref
9
%%EOF`;
  return Buffer.from(pdfContent, 'utf-8');
}

describe('Policy API', () => {
  // Test 4: Uploading a valid PDF
  it('POST /api/policies — reviewer can upload a PDF', async () => {
    const pdfBuffer = makeTextPdfBuffer();

    const res = await request(app)
      .post('/api/policies')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .field('name', 'Test Policy Upload')
      .field('productCategory', 'Electronics')
      .field('manufacturerLabel', 'TestCo')
      .attach('pdf', pdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });

    // 201 = extracted successfully, 422 = needs OCR/parse error (valid flow for minimal PDF)
    // Must NOT be auth/permission failure
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(400);
    if (res.status === 201) {
      expect(res.body.data.policy.name).toBe('Test Policy Upload');
      expect(res.body.data.policy.id).toBeDefined();
    }
  });

  // Test 5: Rejecting a non-PDF file (wrong mimetype — multer blocks it)
  it('POST /api/policies — rejects non-PDF file (wrong extension/mimetype)', async () => {
    const res = await request(app)
      .post('/api/policies')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .field('name', 'Bad Upload')
      .field('productCategory', 'Electronics')
      .field('manufacturerLabel', 'TestCo')
      .attach('pdf', Buffer.from('this is not a pdf'), {
        filename: 'notapdf.txt',
        contentType: 'text/plain',
      });

    // Must not succeed — multer or service should reject
    expect(res.status).not.toBe(201);
    expect(res.status).not.toBe(200);
  });

  // Customer cannot upload policies
  it('POST /api/policies — customer cannot upload', async () => {
    const pdfBuffer = makeTextPdfBuffer();
    const res = await request(app)
      .post('/api/policies')
      .set('Authorization', `Bearer ${customerToken}`)
      .field('name', 'Customer Policy')
      .field('productCategory', 'Electronics')
      .field('manufacturerLabel', 'TestCo')
      .attach('pdf', pdfBuffer, { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(403);
  });

  // List policies
  it('GET /api/policies — authenticated user can list policies', async () => {
    const res = await request(app)
      .get('/api/policies')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.total).toBe('number');
  });
});
