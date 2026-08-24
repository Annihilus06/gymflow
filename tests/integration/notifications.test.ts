import { describe, it, expect, vi } from 'vitest';
import { NotificationService } from '@/lib/services/notification.service';

vi.mock('@/lib/db/prisma', () => ({
  default: {
    pushSubscription: {
      upsert: vi.fn().mockResolvedValue({ id: 'sub_123', endpoint: 'https://push.example.com/sub/1' }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([{ id: 'sub_123', endpoint: 'https://push.example.com/sub/1' }]),
    },
  },
}));

describe('NotificationService Integration', () => {
  it('saves and deletes push subscriptions', async () => {
    const sub = await NotificationService.saveSubscription('u1', {
      endpoint: 'https://push.example.com/sub/1',
      keys: { p256dh: 'test_p256dh', auth: 'test_auth' },
    });

    expect(sub.id).toBe('sub_123');

    const del = await NotificationService.removeSubscription('u1', 'https://push.example.com/sub/1');
    expect(del.count).toBe(1);
  });

  it('generates deterministic workout day reminders', () => {
    const reminder = NotificationService.generateWorkoutReminder('Chest Day', ['Chest', 'Triceps']);
    expect(reminder.title).toContain('Time to Train');
    expect(reminder.body).toContain('Chest Day (Chest, Triceps)');
    expect(reminder.url).toBe('/execute');
  });

  it('generates weekly remaining workout reminders', () => {
    const reminder = NotificationService.generateWeeklySummaryReminder(2);
    expect(reminder.title).toContain('Weekly Workout Reminder');
    expect(reminder.body).toContain('2 workouts remaining this week');

    const completedReminder = NotificationService.generateWeeklySummaryReminder(0);
    expect(completedReminder.title).toContain('Weekly Target Reached');
  });

  it('generates goal progress milestone notifications', () => {
    const reminder = NotificationService.generateGoalProgressReminder('Lose 5 kg', 80);
    expect(reminder.title).toContain('Goal Progress Update');
    expect(reminder.body).toBe('Your goal "Lose 5 kg" is 80% complete!');
    expect(reminder.url).toBe('/goals');
  });

  it('dispatches push notification payload to registered user endpoints', async () => {
    const result = await NotificationService.sendPushNotification('u1', {
      title: 'Workout Alert',
      body: 'Test body',
    });

    expect(result.sentCount).toBe(1);
  });
});
