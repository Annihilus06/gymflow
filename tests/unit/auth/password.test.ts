import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('Password Hashing & Verification', () => {
  it('hashes password securely with bcrypt', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);
  });

  it('correctly verifies a valid password against its hash', async () => {
    const rawPassword = 'MySecretGymPassword99';
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const rawPassword = 'CorrectPassword1';
    const wrongPassword = 'WrongPassword2';
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('handles empty inputs safely by returning false', async () => {
    expect(await verifyPassword('', 'somehash')).toBe(false);
    expect(await verifyPassword('password', '')).toBe(false);
  });
});
