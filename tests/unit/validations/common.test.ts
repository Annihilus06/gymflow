import { describe, it, expect } from 'vitest';
import {
  paginationQuerySchema,
  entityIdSchema,
  dateParamSchema,
  statsPeriodSchema,
} from '@/lib/validations/common.schema';

describe('Common Schemas', () => {
  describe('paginationQuerySchema', () => {
    it('provides default limit of 20 when limit is omitted', () => {
      const result = paginationQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it('parses and transforms string limit to number', () => {
      const result = paginationQuerySchema.safeParse({ limit: '35', cursor: 'cursor-123' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(35);
        expect(result.data.cursor).toBe('cursor-123');
      }
    });

    it('rejects limits greater than 50', () => {
      const result = paginationQuerySchema.safeParse({ limit: '100' });
      expect(result.success).toBe(false);
    });

    it('rejects negative or zero limits', () => {
      const result = paginationQuerySchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
    });
  });

  describe('entityIdSchema', () => {
    it('accepts valid non-empty string IDs', () => {
      const result = entityIdSchema.safeParse({ id: 'cuid12345' });
      expect(result.success).toBe(true);
    });

    it('rejects empty string ID', () => {
      const result = entityIdSchema.safeParse({ id: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('dateParamSchema', () => {
    it('accepts YYYY-MM-DD formatted date string', () => {
      const result = dateParamSchema.safeParse({ date: '2026-08-24' });
      expect(result.success).toBe(true);
    });

    it('rejects malformed date strings', () => {
      const result = dateParamSchema.safeParse({ date: '24-08-2026' });
      expect(result.success).toBe(false);
    });
  });

  describe('statsPeriodSchema', () => {
    it('defaults to week when period is omitted', () => {
      const result = statsPeriodSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.period).toBe('week');
      }
    });

    it('accepts valid periods', () => {
      for (const period of ['week', 'month', 'year'] as const) {
        const result = statsPeriodSchema.safeParse({ period });
        expect(result.success).toBe(true);
      }
    });

    it('rejects invalid periods', () => {
      const result = statsPeriodSchema.safeParse({ period: 'decade' });
      expect(result.success).toBe(false);
    });
  });
});
