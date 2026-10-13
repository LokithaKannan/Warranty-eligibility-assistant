import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, dots, dashes, underscores'),
  email: z.string().email('Invalid email address').max(200),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50)
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, dots, dashes, underscores'),
  email: z.string().email('Invalid email address').max(200),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200),
  role: z.enum(['ADMIN', 'REVIEWER', 'CUSTOMER']).default('CUSTOMER'),
});

export const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['ADMIN', 'REVIEWER', 'CUSTOMER']).optional(),
});

export const adminSetupSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  setupToken: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AdminSetupInput = z.infer<typeof adminSetupSchema>;
