import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationService } from '@/lib/services/notification.service';
import { z } from 'zod';

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = subscriptionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Invalid subscription payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await NotificationService.saveSubscription(session.user.id, parsed.data);
    return NextResponse.json({ success: true, subscriptionId: result.id });
  } catch {
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to save subscription' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ code: 'UNAUTHORIZED', message: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = unsubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Invalid endpoint payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    await NotificationService.removeSubscription(session.user.id, parsed.data.endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Failed to remove subscription' }, { status: 500 });
  }
}
