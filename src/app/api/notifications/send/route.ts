import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notification.service';
import { z } from 'zod';

const sendNotificationSchema = z.object({
  type: z.enum(['WORKOUT_REMINDER', 'WEEKLY_SUMMARY', 'GOAL_PROGRESS', 'CUSTOM']),
  workoutLabel: z.string().optional(),
  muscleGroups: z.array(z.string()).optional(),
  remainingCount: z.number().int().optional(),
  goalTitle: z.string().optional(),
  progressPct: z.number().optional(),
  customTitle: z.string().optional(),
  customBody: z.string().optional(),
  url: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { code: 'UNAUTHORIZED', message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = sendNotificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Invalid notification parameters',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    // Fix: Explicitly defining the shape here keeps both TypeScript and ESLint perfectly happy!
    let payload: { title: string; body: string; url?: string } = {
      title: 'GymFlow Notification',
      body: 'Stay active and hit your daily workout goals!',
      url: '/dashboard',
    };

    switch (parsed.data.type) {
      case 'WORKOUT_REMINDER':
        payload = NotificationService.generateWorkoutReminder(
          parsed.data.workoutLabel || 'Scheduled Workout',
          parsed.data.muscleGroups
        );
        break;
      case 'WEEKLY_SUMMARY':
        payload = NotificationService.generateWeeklySummaryReminder(
          parsed.data.remainingCount ?? 1
        );
        break;
      case 'GOAL_PROGRESS':
        payload = NotificationService.generateGoalProgressReminder(
          parsed.data.goalTitle || 'Fitness Target',
          parsed.data.progressPct ?? 50
        );
        break;
      case 'CUSTOM':
        payload = {
          title: parsed.data.customTitle || 'GymFlow Alert',
          body: parsed.data.customBody || 'Notification from GymFlow',
          url: parsed.data.url || '/dashboard',
        };
        break;
    }

    const result = await NotificationService.sendPushNotification(session.user.id, payload);

    return NextResponse.json({
      success: true,
      payload,
      sentCount: result.sentCount,
    });
  } catch {
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
