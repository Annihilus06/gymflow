import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ExerciseCacheService } from '@/lib/exercise-api/cache';
import { AppError } from '@/lib/errors/app-error';
import { handleApiError } from '@/lib/errors/handle-api-error';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return handleApiError(AppError.unauthorized());
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';

    if (!query.trim()) {
      return NextResponse.json(
        {
          source: 'LOCAL_FALLBACK',
          query: '',
          results: [],
          bestMatch: null,
          matchStatus: 'UNMATCHED',
          cacheHit: false,
        },
        { status: 200 }
      );
    }

    const result = await ExerciseCacheService.searchAndCache(query);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}
