import { normalizeExternalExercise, type NormalizedExercise, type ExternalRawExercise } from './normalizer';
import { INITIAL_SEED_EXERCISES } from '@/lib/services/exercise.service';

export interface ExerciseSearchOptions {
  limit?: number;
  muscle?: string;
}

export interface ExternalSearchResponse {
  source: 'EXTERNAL_API' | 'LOCAL_FALLBACK';
  query: string;
  results: NormalizedExercise[];
  bestMatch: NormalizedExercise | null;
  matchStatus: 'EXACT_MATCH' | 'HIGH_CONFIDENCE' | 'LOW_CONFIDENCE' | 'UNMATCHED';
}

export class ExternalExerciseClient {
  private static lastRequestTimestamp = 0;
  private static readonly MIN_REQUEST_INTERVAL_MS = 300; // Rate limit protection (300ms)

  /**
   * Enforces inter-request throttling to respect external API rate limits.
   */
  private static async throttle() {
    const now = Date.now();
    const elapsed = now - this.lastRequestTimestamp;
    if (elapsed < this.MIN_REQUEST_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, this.MIN_REQUEST_INTERVAL_MS - elapsed));
    }
    this.lastRequestTimestamp = Date.now();
  }

  /**
   * Searches external exercise library and returns normalized exercises with match confidence.
   */
  static async search(query: string, options: ExerciseSearchOptions = {}): Promise<ExternalSearchResponse> {
    const trimmed = query.trim();
    if (!trimmed) {
      return {
        source: 'LOCAL_FALLBACK',
        query: '',
        results: [],
        bestMatch: null,
        matchStatus: 'UNMATCHED',
      };
    }

    await this.throttle();

    // Check if external API key is configured
    const apiKey = process.env.EXERCISE_API_KEY || process.env.MUSCLEWIKI_API_KEY;
    const apiHost = process.env.EXERCISE_API_HOST || 'exercisedb.p.rapidapi.com';

    let rawResults: ExternalRawExercise[] = [];
    let source: 'EXTERNAL_API' | 'LOCAL_FALLBACK' = 'LOCAL_FALLBACK';

    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const url = `https://${apiHost}/exercises/name/${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, {
          headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': apiHost,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          rawResults = await res.json();
          source = 'EXTERNAL_API';
        }
      } catch {
        // Fallback gracefully on network / timeout / rate limit errors
        rawResults = [];
      }
    }

    // If external API has no results or failed/unconfigured, search local catalogue
    if (rawResults.length === 0) {
      const cleanedQuery = trimmed.replace(/\+/g, ' ').toLowerCase();
      const queryTokens = cleanedQuery.split(/\s+/).filter(Boolean);
      rawResults = INITIAL_SEED_EXERCISES.filter((ex) => {
        const exName = ex.name.toLowerCase();
        const muscle = ex.primaryMuscle.toLowerCase();
        return (
          exName.includes(cleanedQuery) ||
          muscle.includes(cleanedQuery) ||
          queryTokens.some((token) => exName.includes(token) || muscle.includes(token))
        );
      }).map((ex) => ({
        id: `seed_${ex.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: ex.name,
        target: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        instructions: ex.instructions,
        description: ex.description,
        equipment: 'Barbell',
        difficulty: 'INTERMEDIATE',
        attribution: 'GymFlow Standard Exercise Catalogue',
      }));
    }

    // Normalize all results
    const normalizedList: NormalizedExercise[] = rawResults.map((raw) =>
      normalizeExternalExercise(raw, trimmed)
    );

    // Sort by confidence score descending
    normalizedList.sort((a, b) => b.confidenceScore - a.confidenceScore);

    const bestMatch = normalizedList[0] ?? null;

    let matchStatus: 'EXACT_MATCH' | 'HIGH_CONFIDENCE' | 'LOW_CONFIDENCE' | 'UNMATCHED' = 'UNMATCHED';

    if (bestMatch) {
      if (bestMatch.confidenceScore >= 0.95) {
        matchStatus = 'EXACT_MATCH';
      } else if (bestMatch.confidenceScore >= 0.6) {
        matchStatus = 'HIGH_CONFIDENCE';
      } else if (bestMatch.confidenceScore >= 0.3) {
        matchStatus = 'LOW_CONFIDENCE';
      } else {
        matchStatus = 'UNMATCHED';
      }
    }

    const limit = options.limit || 10;

    return {
      source,
      query: trimmed,
      results: normalizedList.slice(0, limit),
      bestMatch: matchStatus !== 'UNMATCHED' ? bestMatch : null,
      matchStatus,
    };
  }

  /**
   * Looks up an individual exercise by its external ID.
   */
  static async lookup(externalId: string): Promise<NormalizedExercise | null> {
    const searchRes = await this.search(externalId.replace(/^ext_|^seed_/, '').replace(/_/g, ' '));
    return searchRes.results.find((r) => r.externalId === externalId) || searchRes.results[0] || null;
  }
}
