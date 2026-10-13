import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { listAuditLogs } from '../controllers/admin.controller';
import {
  createUserAdmin,
  listUsers,
  updateUserAdmin,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from '../validators/auth.validator';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', listUsers);

/**
 * @swagger
 * /api/admin/users:
 *   post:
 *     summary: Create a new user
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 */
router.post('/users', validate(createUserSchema), createUserAdmin);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   patch:
 *     summary: Update user role or status
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/users/:id', validate(updateUserSchema), updateUserAdmin);

/**
 * @swagger
 * /api/admin/audit-logs:
 *   get:
 *     summary: View audit logs
 *     tags: [Administration]
 *     security:
 *       - bearerAuth: []
 */
router.get('/audit-logs', listAuditLogs);

export { router as adminRouter };
