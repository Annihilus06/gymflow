import { z } from 'zod';

/**
 * Standard cursor-based pagination query schema.
 */
export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().min(1).max(50)),
});

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

/**
 * CUID or UUID string validation schema for path parameters.
 */
export const entityIdSchema = z.object({
  id: z.string().min(1, 'ID cannot be empty'),
});

/**
 * ISO date string validation schema.
 */
export const dateParamSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

/**
 * Stats period query schema.
 */
export const statsPeriodSchema = z.object({
  period: z.enum(['week', 'month', 'year']).default('week'),
  date: z.string().optional(),
});

export type StatsPeriodInput = z.infer<typeof statsPeriodSchema>;
