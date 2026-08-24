import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '@/lib/validations/auth.schema';

describe('Auth Validation Schemas', () => {
  describe('registerSchema', () => {
    it('accepts valid registration data', () => {
      const valid = {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email formats', () => {
      const invalid = {
        name: 'Alex Johnson',
        email: 'not-an-email',
        password: 'Password123',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects passwords shorter than 8 characters', () => {
      const invalid = {
        name: 'Alex',
        email: 'alex@example.com',
        password: 'Pass1',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects passwords without numbers', () => {
      const invalid = {
        name: 'Alex',
        email: 'alex@example.com',
        password: 'PasswordOnly',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('rejects when password and confirmPassword do not match', () => {
      const invalid = {
        name: 'Alex',
        email: 'alex@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
      };
      const result = registerSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('loginSchema', () => {
    it('accepts valid login data', () => {
      const valid = {
        email: 'alex@example.com',
        password: 'Password123',
      };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects empty password', () => {
      const invalid = {
        email: 'alex@example.com',
        password: '',
      };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
