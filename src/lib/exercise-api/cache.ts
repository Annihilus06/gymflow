import prisma from '@/lib/db/prisma';
import { ExternalExerciseClient, type ExternalSearchResponse } from './client';
import type { NormalizedExercise } from './normalizer';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days Cache TTL

export class ExerciseCacheService {
  /**
   * Searches exercises using local DB cache first; falls back to external API, normalizes and caches.
   */
  static async searchAndCache(query: string): Promise<ExternalSearchResponse & { cacheHit: boolean }> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        source: 'LOCAL_FALLBACK',
        query: '',
        results: [],
        bestMatch: null,
        matchStatus: 'UNMATCHED',
        cacheHit: false,
      };
    }

    // 1. Check local DB cache first
    const cachedExercises = await prisma.exercise.findMany({
      where: {
        name: { contains: trimmed, mode: 'insensitive' },
      },
      include: {
        muscles: {
          include: { muscleGroup: true },
        },
      },
      take: 10,
    });

    if (cachedExercises.length > 0) {
      // Check if cache is fresh
      const freshest = cachedExercises[0]!;
      const isFresh = Date.now() - freshest.updatedAt.getTime() < CACHE_TTL_MS;

      if (isFresh) {
        const results: NormalizedExercise[] = cachedExercises.map((e) => ({
          externalId: e.externalId || e.id,
          name: e.name,
          description: e.description,
          instructions: e.instructions,
          category: e.category,
          equipment: 'Barbell',
          difficulty: 'INTERMEDIATE',
          imageUrl: e.imageUrl,
          videoUrl: e.videoUrl,
          primaryMuscles: e.muscles
            .filter((m) => m.isPrimary)
            .map((m) => m.muscleGroup.name),
          secondaryMuscles: e.muscles
            .filter((m) => !m.isPrimary)
            .map((m) => m.muscleGroup.name),
          attribution: 'GymFlow Verified Exercise Library',
          confidenceScore: e.name.toLowerCase() === trimmed.toLowerCase() ? 1.0 : 0.85,
        }));

        return {
          source: 'LOCAL_FALLBACK',
          query: trimmed,
          results,
          bestMatch: results[0] ?? null,
          matchStatus: results[0]?.confidenceScore === 1.0 ? 'EXACT_MATCH' : 'HIGH_CONFIDENCE',
          cacheHit: true,
        };
      }
    }

    // 2. Cache Miss: Query External API
    const externalResponse = await ExternalExerciseClient.search(trimmed);

    // 3. Upsert results into local DB cache
    if (externalResponse.results.length > 0) {
      for (const normalized of externalResponse.results) {
        try {
          await this.upsertNormalizedExercise(normalized);
        } catch {
          // Non-blocking cache write error
        }
      }
    }

    return {
      ...externalResponse,
      cacheHit: false,
    };
  }

  /**
   * Upserts a normalized exercise and its muscle group relationships into PostgreSQL.
   */
  static async upsertNormalizedExercise(normalized: NormalizedExercise) {
    // 1. Ensure primary muscle group exists
    const primaryMuscleName = normalized.primaryMuscles[0] || 'Full Body';
    let primaryMg = await prisma.muscleGroup.findUnique({
      where: { name: primaryMuscleName },
    });

    if (!primaryMg) {
      primaryMg = await prisma.muscleGroup.create({
        data: {
          name: primaryMuscleName,
          bodyPart: primaryMuscleName,
        },
      });
    }

    // 2. Check if exercise already exists by externalId or name
    const existing = await prisma.exercise.findFirst({
      where: {
        OR: [{ externalId: normalized.externalId }, { name: normalized.name }],
      },
    });

    if (existing) {
      return prisma.exercise.update({
        where: { id: existing.id },
        data: {
          description: normalized.description,
          instructions: normalized.instructions,
          imageUrl: normalized.imageUrl,
          videoUrl: normalized.videoUrl,
        },
      });
    }

    // 3. Create new exercise with muscle associations
    return prisma.exercise.create({
      data: {
        externalId: normalized.externalId,
        name: normalized.name,
        category: normalized.category,
        description: normalized.description,
        instructions: normalized.instructions,
        imageUrl: normalized.imageUrl,
        videoUrl: normalized.videoUrl,
        isCustom: false,
        muscles: {
          create: {
            muscleGroupId: primaryMg.id,
            isPrimary: true,
          },
        },
      },
    });
  }
}
