import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password securely using bcrypt.
 *
 * @param password - Plaintext password
 * @returns Hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 *
 * @param password - Plaintext candidate password
 * @param hash - Stored bcrypt hash
 * @returns True if password matches the hash, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}
