import { Router } from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createPolicySchema,
  confirmPolicySchema,
  updatePolicySchema,
} from '../validators/policy.validator';
import {
  upload,
  confirm,
  list,
  getById,
  update,
  getExtractedTextHandler,
  getClauses,
} from '../controllers/policy.controller';
import { env } from '../config/env';

const router = Router();

// Multer: memory storage, validate file type and size in service
const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.UPLOAD_MAX_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted'));
    }
  },
});

/**
 * @swagger
 * /api/policies:
 *   post:
 *     summary: Upload a warranty policy PDF
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [pdf, name, productCategory, manufacturerLabel]
 *             properties:
 *               pdf:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               productCategory:
 *                 type: string
 *               manufacturerLabel:
 *                 type: string
 *               reviewerNotes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Policy uploaded and extracted
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  multerUpload.single('pdf'),
  validate(createPolicySchema),
  upload
);

/**
 * @swagger
 * /api/policies:
 *   get:
 *     summary: List warranty policies
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, list);

/**
 * @swagger
 * /api/policies/{id}:
 *   get:
 *     summary: Get policy details
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authenticate, getById);

/**
 * @swagger
 * /api/policies/{id}:
 *   patch:
 *     summary: Update policy metadata
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(updatePolicySchema),
  update
);

/**
 * @swagger
 * /api/policies/{id}/confirm:
 *   post:
 *     summary: Confirm policy details (reviewer action)
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/confirm',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(confirmPolicySchema),
  confirm
);

/**
 * @swagger
 * /api/policies/{id}/extracted-text:
 *   get:
 *     summary: Get extracted text from the policy PDF
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/extracted-text', authenticate, authorize('ADMIN', 'REVIEWER'), getExtractedTextHandler);

/**
 * @swagger
 * /api/policies/{id}/clauses:
 *   get:
 *     summary: Get policy clauses
 *     tags: [Policies]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/clauses', authenticate, getClauses);

export { router as policyRouter };
