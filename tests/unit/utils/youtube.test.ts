import { describe, it, expect } from 'vitest';
import {
  extractYouTubeVideoId,
  getYouTubeEmbedUrl,
  getYouTubeSearchUrl,
  generateExerciseFormGuide,
} from '@/lib/utils/youtube';

describe('YouTube Utility & Exercise Form Guide Tests', () => {
  describe('extractYouTubeVideoId', () => {
    it('extracts ID from standard watch URL', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        'dQw4w9WgXcQ'
      );
    });

    it('extracts ID from youtu.be short URL', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from shorts URL', () => {
      expect(extractYouTubeVideoId('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts raw 11-char ID', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for empty or invalid URLs', () => {
      expect(extractYouTubeVideoId('')).toBeNull();
      expect(extractYouTubeVideoId(null)).toBeNull();
      expect(extractYouTubeVideoId(undefined)).toBeNull();
      expect(extractYouTubeVideoId('https://example.com/not-youtube')).toBeNull();
    });
  });

  describe('getYouTubeEmbedUrl & getYouTubeSearchUrl', () => {
    it('returns direct embed URL when valid video URL is given', () => {
      const url = getYouTubeEmbedUrl('Dumbbell Curl', 'https://youtu.be/dQw4w9WgXcQ');
      expect(url).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    });

    it('returns search embed URL when no custom video URL is provided', () => {
      const url = getYouTubeEmbedUrl('Incline Bench Press');
      expect(url).toContain('listType=search');
      expect(url).toContain('Incline%20Bench%20Press');
    });

    it('returns valid search URL for external link', () => {
      const url = getYouTubeSearchUrl('Barbell Squat');
      expect(url).toContain('https://www.youtube.com/results?search_query=');
      expect(url).toContain('Barbell%20Squat');
    });
  });

  describe('generateExerciseFormGuide', () => {
    it('generates pressing cues for Bench Press', () => {
      const guide = generateExerciseFormGuide('Barbell Bench Press', 'Chest');
      expect(guide.exerciseName).toBe('Barbell Bench Press');
      expect(guide.setupCues.length).toBeGreaterThan(0);
      expect(guide.executionCues.some((c) => c.toLowerCase().includes('chest'))).toBe(true);
      expect(guide.commonMistakes.some((m) => m.toLowerCase().includes('elbows'))).toBe(true);
      expect(guide.breathingTip).toBeTruthy();
    });

    it('generates squat cues for Barbell Squat', () => {
      const guide = generateExerciseFormGuide('Barbell Back Squat', 'Quads');
      expect(guide.executionCues.some((c) => c.toLowerCase().includes('knees'))).toBe(true);
      expect(guide.commonMistakes.some((m) => m.toLowerCase().includes('valgus') || m.toLowerCase().includes('caving'))).toBe(true);
    });

    it('generates curl cues for Dumbbell Curl', () => {
      const guide = generateExerciseFormGuide('Dumbbell Bicep Curl', 'Biceps');
      expect(guide.setupCues.some((c) => c.toLowerCase().includes('elbows'))).toBe(true);
      expect(guide.executionCues.some((c) => c.toLowerCase().includes('supinate') || c.toLowerCase().includes('biceps'))).toBe(true);
    });

    it('generates tricep cues for Tricep Rope Pushdown', () => {
      const guide = generateExerciseFormGuide('Tricep Rope Pushdown', 'Triceps');
      expect(guide.executionCues.some((c) => c.toLowerCase().includes('triceps') || c.toLowerCase().includes('extension'))).toBe(true);
    });

    it('generates deadlift cues for Romanian Deadlift', () => {
      const guide = generateExerciseFormGuide('Romanian Deadlift', 'Hamstrings');
      expect(guide.setupCues.some((c) => c.toLowerCase().includes('hinge'))).toBe(true);
      expect(guide.commonMistakes.some((m) => m.toLowerCase().includes('spine') || m.toLowerCase().includes('rounding'))).toBe(true);
    });

    it('generates universal fallback cues for unique custom exercise', () => {
      const guide = generateExerciseFormGuide('Custom Kettlebell Snatch', 'Full Body');
      expect(guide.setupCues.length).toBeGreaterThan(0);
      expect(guide.executionCues.length).toBeGreaterThan(0);
      expect(guide.breathingTip).toBeTruthy();
    });
  });
});
