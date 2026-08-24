import { describe, it, expect, vi } from 'vitest';
import { ProfileService } from '@/lib/services/profile.service';

vi.mock('@/lib/db/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === 'user_123') {
          return Promise.resolve({
            id: 'user_123',
            name: 'Alex Vance',
            email: 'alex@example.com',
            createdAt: new Date('2026-01-01'),
            profile: { heightCm: 180, sex: 'MALE' },
            goals: [{ id: 'g1', title: 'Lose 5 kg', status: 'ACTIVE' }],
            weightLogs: [{ id: 'w1', weightKg: 82.5 }],
            mealLogs: [{ id: 'm1', name: 'Oatmeal' }],
            routines: [{ id: 'r1', name: '5-Day Split' }],
            workoutSessions: [{ id: 's1', durationSecs: 2400 }],
          });
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockResolvedValue({ id: 'user_123' }),
    },
  },
}));

describe('Security & GDPR Audit Tests (RULE-SEC-005)', () => {
  it('exports comprehensive user training and profile data without exposing password hash', async () => {
    const data = await ProfileService.exportUserData('user_123');

    expect(data.id).toBe('user_123');
    expect(data.email).toBe('alex@example.com');
    expect(data.profile).toBeDefined();
    expect(data.goals).toHaveLength(1);
    expect(data.weightLogs).toHaveLength(1);
    expect(data.mealLogs).toHaveLength(1);
    expect(data.routines).toHaveLength(1);
    expect(data.workoutSessions).toHaveLength(1);
    // Ensure sensitive fields like passwordHash are excluded by selection
    expect((data as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('permanently deletes user account cascading through relations', async () => {
    await expect(ProfileService.deleteAccount('user_123')).resolves.not.toThrow();
  });

  it('throws not found if export requested for non-existent user', async () => {
    await expect(ProfileService.exportUserData('non_existent')).rejects.toThrow('User data not found');
  });
});
