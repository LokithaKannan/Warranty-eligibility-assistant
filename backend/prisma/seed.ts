/**
 * Database seed script.
 * Creates demo users and sample warranty policies.
 * All data is FICTIONAL and for demonstration purposes only.
 * Do not use real customer or product data.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

// Load .env
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

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Seeding database...');

  // ---------------------------------------------------------------
  // Demo Users
  // ---------------------------------------------------------------
  const adminPassword = await bcrypt.hash('Admin@Demo2024!', SALT_ROUNDS);
  const reviewerPassword = await bcrypt.hash('Reviewer@Demo2024!', SALT_ROUNDS);
  const customerPassword = await bcrypt.hash('Customer@Demo2024!', SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@warrantyassist.demo',
      passwordHash: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { username: 'reviewer' },
    update: {},
    create: {
      username: 'reviewer',
      email: 'reviewer@warrantyassist.demo',
      passwordHash: reviewerPassword,
      role: 'REVIEWER',
      isActive: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { username: 'customer' },
    update: {},
    create: {
      username: 'customer',
      email: 'customer@warrantyassist.demo',
      passwordHash: customerPassword,
      role: 'CUSTOMER',
      isActive: true,
    },
  });

  console.log('✅ Users created:', admin.username, reviewer.username, customer.username);

  // ---------------------------------------------------------------
  // Sample Policy 1: Fictional Wireless Headphones — 12-month warranty
  // ---------------------------------------------------------------
  const policy1 = await prisma.policy.upsert({
    where: { id: 'policy-seed-001' },
    update: {},
    create: {
      id: 'policy-seed-001',
      name: 'SoundWave X200 Limited Warranty',
      productCategory: 'Wireless Headphones',
      manufacturerLabel: 'SoundWave Electronics (Fictional Demo)',
      durationMonths: 12,
      proofRequired: true,
      originalFilename: 'soundwave-x200-warranty.pdf',
      storedFilename: 'seed-policy-001.pdf',
      fileHash: 'seed-hash-001',
      extractionStatus: 'EXTRACTED',
      extractedText: `SOUNDWAVE X200 LIMITED WARRANTY

SoundWave Electronics warrants this product against defects in materials and workmanship for a period of 12 months from the date of original purchase.

WARRANTY COVERAGE:
This limited warranty covers defects in materials and workmanship under normal use and service conditions for a period of twelve (12) months from the date of original retail purchase.

EXCLUSIONS:
This warranty does not cover damage resulting from: accident, misuse, abuse, neglect, unauthorized modification, unauthorized repair, physical damage, water damage, liquid damage, fire damage, flood damage, or any other external causes.

This warranty does not cover cosmetic damage, normal wear and tear, or damage caused by improper installation.

PROOF OF PURCHASE:
To obtain warranty service, you must provide the original dated receipt or proof of purchase from an authorized retailer.

HOW TO OBTAIN WARRANTY SERVICE:
Contact our customer support team at support@soundwave-demo.example.com or visit an authorized service centre. You will need to submit a claim with proof of purchase within the warranty period.

This warranty gives you specific legal rights. This product is intended for residential use only.`,
      isConfirmed: true,
      isActive: true,
      reviewerNotes: 'Standard 12-month limited warranty. Reviewed and confirmed.',
      createdById: admin.id,
    },
  });

  const clauses1 = [
    { id: 'clause-seed-001-dur', clauseType: 'WARRANTY_DURATION', clauseText: 'This limited warranty covers defects in materials and workmanship under normal use and service conditions for a period of twelve (12) months from the date of original retail purchase.', pageNumber: 1 },
    { id: 'clause-seed-001-exc1', clauseType: 'EXCLUSION', clauseText: 'This warranty does not cover damage resulting from: accident, misuse, abuse, neglect, unauthorized modification, unauthorized repair, physical damage, water damage, liquid damage, fire damage, flood damage, or any other external causes.', pageNumber: 1 },
    { id: 'clause-seed-001-exc2', clauseType: 'EXCLUSION', clauseText: 'This warranty does not cover cosmetic damage, normal wear and tear, or damage caused by improper installation.', pageNumber: 1 },
    { id: 'clause-seed-001-proof', clauseType: 'PROOF_REQUIREMENT', clauseText: 'To obtain warranty service, you must provide the original dated receipt or proof of purchase from an authorized retailer.', pageNumber: 1 },
    { id: 'clause-seed-001-proc', clauseType: 'CLAIM_PROCEDURE', clauseText: 'Contact our customer support team or visit an authorized service centre. You will need to submit a claim with proof of purchase within the warranty period.', pageNumber: 1 },
  ];
  for (const c of clauses1) {
    await prisma.policyClause.upsert({ where: { id: c.id }, update: {}, create: { ...c, policyId: policy1.id, confirmedByReviewer: true } });
  }

  // ---------------------------------------------------------------
  // Sample Policy 2: Fictional Mechanical Keyboard — 24-month warranty
  // ---------------------------------------------------------------
  const policy2 = await prisma.policy.upsert({
    where: { id: 'policy-seed-002' },
    update: {},
    create: {
      id: 'policy-seed-002',
      name: 'TypeMaster Pro Mechanical Keyboard — 2-Year Warranty',
      productCategory: 'Mechanical Keyboard',
      manufacturerLabel: 'TypeMaster Peripherals (Fictional Demo)',
      durationMonths: 24,
      proofRequired: true,
      originalFilename: 'typemaster-pro-warranty.pdf',
      storedFilename: 'seed-policy-002.pdf',
      fileHash: 'seed-hash-002',
      extractionStatus: 'EXTRACTED',
      extractedText: `TYPEMASTER PRO MECHANICAL KEYBOARD — LIMITED WARRANTY

TypeMaster Peripherals warrants this product to be free from defects in materials and workmanship for a period of two (2) years from the date of original purchase.

WHAT IS COVERED:
Manufacturing defects in parts and workmanship. Mechanical switch failures under normal typing conditions. PCB and internal component defects.

WHAT IS NOT COVERED:
Physical damage caused by dropping, impact, or misuse. Water damage or liquid spills. Modifications made by unauthorized personnel. Normal wear and tear including keycap legends fading after extended use. Damage caused by power surges or improper installation.

PROOF OF PURCHASE REQUIRED:
Original dated sales invoice or receipt required for all warranty claims.

CLAIM PROCESS:
To submit a warranty claim, contact TypeMaster support at warranty@typemaster-demo.example.com. Provide your proof of purchase, product serial number, and description of the defect. Our team will assess the claim and provide return shipping instructions if applicable.

This warranty is non-transferable and applies only to the original purchaser.`,
      isConfirmed: true,
      isActive: true,
      reviewerNotes: '24-month limited warranty. Reviewed and confirmed.',
      createdById: admin.id,
    },
  });

  const clauses2 = [
    { id: 'clause-seed-002-dur', clauseType: 'WARRANTY_DURATION', clauseText: 'TypeMaster Peripherals warrants this product to be free from defects in materials and workmanship for a period of two (2) years from the date of original purchase.', pageNumber: 1 },
    { id: 'clause-seed-002-exc1', clauseType: 'EXCLUSION', clauseText: 'Physical damage caused by dropping, impact, or misuse. Water damage or liquid spills. Modifications made by unauthorized personnel.', pageNumber: 1 },
    { id: 'clause-seed-002-exc2', clauseType: 'EXCLUSION', clauseText: 'Normal wear and tear including keycap legends fading after extended use. Damage caused by power surges or improper installation.', pageNumber: 1 },
    { id: 'clause-seed-002-proof', clauseType: 'PROOF_REQUIREMENT', clauseText: 'Original dated sales invoice or receipt required for all warranty claims.', pageNumber: 1 },
    { id: 'clause-seed-002-proc', clauseType: 'CLAIM_PROCEDURE', clauseText: 'To submit a warranty claim, contact TypeMaster support. Provide your proof of purchase, product serial number, and description of the defect.', pageNumber: 1 },
  ];
  for (const c of clauses2) {
    await prisma.policyClause.upsert({ where: { id: c.id }, update: {}, create: { ...c, policyId: policy2.id, confirmedByReviewer: true } });
  }

  // ---------------------------------------------------------------
  // Sample Policy 3: Unconfirmed policy (for testing manual review)
  // ---------------------------------------------------------------
  await prisma.policy.upsert({
    where: { id: 'policy-seed-003' },
    update: {},
    create: {
      id: 'policy-seed-003',
      name: 'SmartWatch Ultra — Warranty (Pending Review)',
      productCategory: 'Smartwatch',
      manufacturerLabel: 'NovaTech Wearables (Fictional Demo)',
      durationMonths: null,
      proofRequired: true,
      originalFilename: 'novatech-smartwatch-warranty.pdf',
      storedFilename: 'seed-policy-003.pdf',
      fileHash: 'seed-hash-003',
      extractionStatus: 'EXTRACTED',
      extractedText: 'Sample unconfirmed policy pending reviewer confirmation.',
      isConfirmed: false,
      isActive: true,
      reviewerNotes: 'Awaiting reviewer confirmation of warranty terms.',
      createdById: admin.id,
    },
  });

  console.log('✅ Policies created:', policy1.name, policy2.name);

  // ---------------------------------------------------------------
  // Sample Claim (for demo)
  // ---------------------------------------------------------------
  const existingClaim = await prisma.claimCheck.findUnique({
    where: { referenceCode: 'WR-DEMO-001' },
  });

  if (!existingClaim) {
    const purchaseDate = new Date('2026-01-15');
    const issueDate = new Date('2026-06-10');
    const warrantyEnd = new Date('2027-01-15');

    const claim = await prisma.claimCheck.create({
      data: {
        referenceCode: 'WR-DEMO-001',
        userId: customer.id,
        policyId: policy1.id,
        productName: 'SoundWave X200 Headphones',
        productCategory: 'Wireless Headphones',
        purchaseDate,
        issueDate,
        issueType: 'BATTERY_FAILURE',
        issueDescription:
          'The battery does not hold charge after 4 months of use. Device drains within 1 hour despite being fully charged.',
        proofAvailable: true,
        calculatedWarrantyEndDate: warrantyEnd,
        preliminaryResult: 'MEETS_BASIC_CHECKS',
        explanation:
          'Appears to meet basic warranty checks — final confirmation required. The 12-month warranty is valid until January 15, 2027. All automated checks passed.',
        ruleResults: JSON.stringify([
          { ruleId: 'RULE_1', ruleName: 'Required Information Check', status: 'PASS', explanation: 'All required information is present.' },
          { ruleId: 'RULE_2', ruleName: 'Policy Confirmation Check', status: 'PASS', explanation: 'Warranty policy is active and confirmed.' },
          { ruleId: 'RULE_3', ruleName: 'Date Validation', status: 'PASS', explanation: 'Dates are chronologically valid.' },
          { ruleId: 'RULE_4', ruleName: 'Warranty Period Check', status: 'PASS', explanation: 'Issue date is within the 12-month warranty period.' },
          { ruleId: 'RULE_5', ruleName: 'Exclusion Check', status: 'PASS', explanation: 'No configured exclusions match the reported issue.' },
          { ruleId: 'RULE_6', ruleName: 'Proof of Purchase Check', status: 'PASS', explanation: 'Proof of purchase is available.' },
          { ruleId: 'RULE_7', ruleName: 'Preliminary Eligibility', status: 'PASS', explanation: 'All basic warranty checks satisfied.' },
        ]),
        reviewStatus: 'PENDING',
      },
    });

    console.log('✅ Demo claim created:', claim.referenceCode);
  }

  console.log('\n📋 Demo Credentials (LOCAL DEVELOPMENT ONLY):');
  console.log('  Admin:    username=admin     password=Admin@Demo2024!');
  console.log('  Reviewer: username=reviewer  password=Reviewer@Demo2024!');
  console.log('  Customer: username=customer  password=Customer@Demo2024!');
  console.log('\n⚠️  Change all passwords before any shared or public deployment.');
  console.log('🌱 Seeding complete!\n');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
