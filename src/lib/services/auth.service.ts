import prisma from '@/lib/db/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { AppError } from '@/lib/errors/app-error';
import type { RegisterInput } from '@/lib/validations/auth.schema';
import type { User, UserProfile } from '@/types/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  onboardingComplete: boolean;
}

export class AuthService {
  /**
   * Registers a new user with email and password, creating their default profile.
   *
   * @param input - Registration form data (name, email, password)
   * @returns Newly created user without sensitive fields
   */
  static async registerUser(input: RegisterInput): Promise<AuthenticatedUser> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      throw AppError.conflict('EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
    }

    const hashedPassword = await hashPassword(input.password);

    // Create user and associated initial profile atomically
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: input.name,
          email: input.email.toLowerCase(),
          passwordHash: hashedPassword,
          profile: {
            create: {
              onboardingComplete: false,
              activityLevel: 'MODERATELY_ACTIVE',
              experienceLevel: 'BEGINNER',
              weightUnit: 'KG',
            },
          },
        },
        include: {
          profile: true,
        },
      });

      return newUser;
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      onboardingComplete: user.profile?.onboardingComplete ?? false,
    };
  }

  /**
   * Validates user credentials during login.
   *
   * @param email - User email address
   * @param password - Plaintext password candidate
   * @returns User object if valid, or null if invalid
   */
  static async validateCredentials(
    email: string,
    password: string
  ): Promise<AuthenticatedUser | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
      },
    });

    if (!user || !user.passwordHash) {
      return null;
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      onboardingComplete: user.profile?.onboardingComplete ?? false,
    };
  }

  /**
   * Retrieves an authenticated user by their unique ID.
   *
   * @param userId - User ID
   * @returns User with profile, or null
   */
  static async getUserById(
    userId: string
  ): Promise<(User & { profile: UserProfile | null }) | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
  }
}
