/**
 * Utilities for YouTube exercise video integration, correct form guides, and biomechanical cues.
 */

export interface FormGuideData {
  exerciseName: string;
  youtubeEmbedUrl: string;
  youtubeSearchUrl: string;
  setupCues: string[];
  executionCues: string[];
  breathingTip: string;
  commonMistakes: string[];
}

/**
 * Extracts a YouTube video ID from various YouTube URL formats (watch?v=, youtu.be/, shorts/, embed/).
 */
export function extractYouTubeVideoId(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Builds a secure, privacy-enhanced YouTube embed URL for an exercise.
 * If a custom videoUrl is present and contains a valid video ID, embeds that specific video.
 * Otherwise, creates an on-demand YouTube search embed focused on correct exercise form.
 */
export function getYouTubeEmbedUrl(exerciseName: string, videoUrl?: string | null): string {
  const directId = extractYouTubeVideoId(videoUrl);
  if (directId) {
    return `https://www.youtube-nocookie.com/embed/${directId}?rel=0&modestbranding=1`;
  }

  const query = `${exerciseName.trim()} exercise correct form tutorial`;
  return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&rel=0&modestbranding=1`;
}

/**
 * Returns a direct YouTube search URL for the exercise to open in a new tab.
 */
export function getYouTubeSearchUrl(exerciseName: string): string {
  const query = `${exerciseName.trim()} exercise correct form proper technique`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

/**
 * Generates comprehensive step-by-step biomechanical form cues, setup checklist,
 * breathing guidelines, and common mistakes for any exercise.
 */
export function generateExerciseFormGuide(
  exerciseName: string,
  primaryMuscle?: string | null,
  videoUrl?: string | null
): FormGuideData {
  const nameLower = exerciseName.toLowerCase();
  const muscleLower = (primaryMuscle || '').toLowerCase();

  const embedUrl = getYouTubeEmbedUrl(exerciseName, videoUrl);
  const searchUrl = getYouTubeSearchUrl(exerciseName);

  // Specific biomechanical cues based on exercise pattern
  if (nameLower.includes('bench press') || nameLower.includes('chest press') || nameLower.includes('dumbbell press')) {
    return {
      exerciseName,
      youtubeEmbedUrl: embedUrl,
      youtubeSearchUrl: searchUrl,
      setupCues: [
        'Lie flat on the bench with feet planted firmly on the floor.',
        'Retract and depress your shoulder blades (pinch shoulder blades together and down into the bench).',
        'Maintain a natural slight arch in your lower back while keeping glutes in contact with the pad.',
      ],
      executionCues: [
        'Unrack weight and stabilize directly over upper chest with straight wrists.',
        'Inhale and lower the weight under control to mid-chest / sternum level over 2-3 seconds.',
        'Keep elbows tucked at a ~45-75 degree angle to protect the rotator cuff.',
        'Press explosively through the palms while driving feet into the floor.',
      ],
      breathingTip: 'Inhale deeply as you lower the weight to brace core; exhale forcefully past the sticking point on the press.',
      commonMistakes: [
        'Flaring elbows out at 90 degrees (excessive shoulder stress)',
        'Bouncing the bar off the chest',
        'Lifting glutes off the bench',
        'Letting wrists bend backwards under heavy load',
      ],
    };
  }

  if (nameLower.includes('squat') || nameLower.includes('leg press')) {
    return {
      exerciseName,
      youtubeEmbedUrl: embedUrl,
      youtubeSearchUrl: searchUrl,
      setupCues: [
        'Set feet shoulder-width or slightly wider, with toes angled outward 15-30 degrees.',
        'Brace your core 360 degrees using the Valsalva maneuver.',
        'Keep chest proud, eyes looking slightly downward or forward to maintain neutral cervical spine.',
      ],
      executionCues: [
        'Initiate the movement by hinging hips back and bending knees simultaneously.',
        'Track knees in the same direction as your toes throughout the descent.',
        'Descend smoothly until hip crease is at or slightly below parallel with top of knees.',
        'Drive through mid-foot and heel to stand up, squeezing glutes at lockout.',
      ],
      breathingTip: 'Take a deep belly breath before starting descent, hold while hitting depth, exhale on the way back up.',
      commonMistakes: [
        'Knees caving inward (valgus collapse)',
        'Heels rising off the floor during the bottom position',
        'Rounding lower back at depth ("butt wink")',
        'Failing to reach full parallel depth',
      ],
    };
  }

  if (nameLower.includes('deadlift') || nameLower.includes('rdl') || nameLower.includes('romanian')) {
    return {
      exerciseName,
      youtubeEmbedUrl: embedUrl,
      youtubeSearchUrl: searchUrl,
      setupCues: [
        'Stand with feet hip-width apart, weight directly over mid-foot.',
        'Hinge hips backwards while maintaining a rigid, flat spine from head to tailbone.',
        'Engage lats by pulling shoulder blades down into your back pockets.',
      ],
      executionCues: [
        'Keep the weight touching or skimming close to your shins/thighs throughout the path.',
        'Push the floor away through your heels and midfoot rather than pulling solely with lower back.',
        'Extend hips and knees together until standing tall (do not hyperextend lower back).',
        'Control the descent by pushing hips back first until past knees.',
      ],
      breathingTip: 'Inhale and brace core hard before each rep. Exhale when locking out at the top.',
      commonMistakes: [
        'Rounding lumbar spine during the pull',
        'Allowing the bar to drift away from the body',
        'Hyperextending and leaning backwards at the top',
        'Jerking the bar off the floor instead of building smooth tension',
      ],
    };
  }

  if (nameLower.includes('curl') || muscleLower.includes('bicep')) {
    return {
      exerciseName,
      youtubeEmbedUrl: embedUrl,
      youtubeSearchUrl: searchUrl,
      setupCues: [
        'Stand tall with feet hip-width apart, shoulders back and chest open.',
        'Pin elbows close to your ribcage/torso — they should act as a fixed hinge.',
        'Grip dumbbells or barbell firmly with straight wrists.',
      ],
      executionCues: [
        'Curl the weight upward by flexing biceps, keeping upper arms motionless.',
        'Supinate wrists (turn pinkies up towards ceiling) at top contraction for maximum bicep peak.',
        'Squeeze hard at the peak for 1 second.',
        'Lower the weight smoothly over 2-3 seconds until arms are fully extended with a stretch.',
      ],
      breathingTip: 'Exhale as you curl the weight up; inhale as you lower the weight under control.',
      commonMistakes: [
        'Swinging torso and using momentum to heave the weight up',
        'Letting elbows drift forward or flaring out',
        'Dropping the weight quickly without controlling the eccentric phase',
        'Bending wrists backward during contraction',
      ],
    };
  }

  if (nameLower.includes('tricep') || nameLower.includes('pushdown') || nameLower.includes('skull crusher') || nameLower.includes('dip')) {
    return {
      exerciseName,
      youtubeEmbedUrl: embedUrl,
      youtubeSearchUrl: searchUrl,
      setupCues: [
        'Position elbows in alignment with target tricep path and keep them locked in place.',
        'Brace core and keep shoulders stable and pulled down.',
        'Maintain neutral wrists throughout the movement.',
      ],
      executionCues: [
        'Extend elbows fully to lock out and contract the triceps.',
        'Pause for a split second at full extension.',
        'Control the return up until forearms reach ~90 degrees or deeper stretch.',
      ],
      breathingTip: 'Exhale on the extension/push; inhale during the eccentric return.',
      commonMistakes: [
        'Using shoulder movement instead of isolating elbow extension',
        'Letting elbows flare excessively outward',
        'Rushing the return phase without feeling tricep stretch',
      ],
    };
  }

  // Default / Universal high-quality form cues
  return {
    exerciseName,
    youtubeEmbedUrl: embedUrl,
    youtubeSearchUrl: searchUrl,
    setupCues: [
      `Set up in a balanced, stable position with core braced and spine neutral.`,
      `Position grip or stance to comfortably target the ${primaryMuscle || 'intended muscle group'}.`,
      `Ensure full range of motion is clear of obstructions.`,
    ],
    executionCues: [
      `Initiate the movement under control, focusing on mind-muscle connection with the ${primaryMuscle || 'target muscles'}.`,
      `Perform the concentric (effort) phase with power while keeping proper alignment.`,
      `Control the eccentric (lowering) phase for 2–3 seconds for optimal muscle hypertrophy and joint safety.`,
      `Complete full range of motion without using excessive swinging or momentum.`,
    ],
    breathingTip: 'Exhale during exertion (lifting/pushing/pulling); inhale steadily during the return/lowering phase.',
    commonMistakes: [
      'Using body momentum or swinging instead of muscular tension',
      'Sacrificing full range of motion to lift heavier weights',
      'Holding breath for prolonged periods (always maintain controlled breathing cadence)',
      'Poor posture or rounding spine under load',
    ],
  };
}
