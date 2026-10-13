import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createClaimSchema, reviewClaimSchema } from '../validators/claim.validator';
import { check, list, getByReference, review, history } from '../controllers/claim.controller';

const router = Router();

/**
 * @swagger
 * /api/claims/check:
 *   post:
 *     summary: Submit a claim for eligibility assessment
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 */
router.post('/check', authenticate, validate(createClaimSchema), check);

/**
 * @swagger
 * /api/claims:
 *   get:
 *     summary: List claim assessments
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticate, list);

/**
 * @swagger
 * /api/claims/{referenceCode}:
 *   get:
 *     summary: Get claim details by reference code
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:referenceCode', authenticate, getByReference);

/**
 * @swagger
 * /api/claims/{referenceCode}/review:
 *   patch:
 *     summary: Review a claim (reviewer/admin only)
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:referenceCode/review',
  authenticate,
  authorize('ADMIN', 'REVIEWER'),
  validate(reviewClaimSchema),
  review
);

/**
 * @swagger
 * /api/claims/{referenceCode}/history:
 *   get:
 *     summary: Get claim review history
 *     tags: [Claims]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:referenceCode/history', authenticate, history);

export { router as claimRouter };
