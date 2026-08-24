import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET() {
  let dbStatus = 'ok';
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost:5432')) {
      await prisma.$queryRaw`SELECT 1`;
    }
  } catch {
    dbStatus = 'unreachable';
  }

  return NextResponse.json(
    {
      status: 'ok',
      app: 'GymFlow',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        api: 'ok',
      },
    },
    { status: 200 }
  );
}
