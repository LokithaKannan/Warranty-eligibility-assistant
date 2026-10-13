import { Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AuthenticatedRequest } from '../types';

type ValidateTarget = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const fieldErrors = result.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ');
      res.status(400).json({
        success: false,
        error: `Validation error: ${fieldErrors}`,
        requestId: req.requestId,
      });
      return;
    }
    // Replace with parsed/coerced values
    (req as any)[target] = result.data;
    next();
  };
}
