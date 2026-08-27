'use client';

import React, { useState } from 'react';

export type BodyMuscleId =
  | 'Chest'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Abs'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Back'
  | 'Traps'
  | 'Forearms';

interface AnatomicalBodyProps {
  selectedMuscle: string;
  onSelectMuscle: (muscle: string) => void;
  view: 'FRONT' | 'BACK';
  className?: string;
}

export function AnatomicalBody({
  selectedMuscle,
  onSelectMuscle,
  view,
  className = '',
}: AnatomicalBodyProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);

  const isMuscleActive = (muscle: string) =>
    selectedMuscle.toLowerCase() === muscle.toLowerCase();

  const isMuscleHovered = (muscle: string) =>
    hoveredMuscle?.toLowerCase() === muscle.toLowerCase();

  const getMuscleFill = (muscle: string) => {
    if (isMuscleActive(muscle)) return 'fill-primary stroke-primary filter drop-shadow(0 0 6px rgba(34,197,94,0.6))';
    if (isMuscleHovered(muscle)) return 'fill-primary/40 stroke-primary/80';
    return 'fill-muted/60 stroke-muted-foreground/40 hover:fill-primary/30';
  };

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Active / Hovered Muscle Label Indicator */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
        <span className="text-[11px] font-black uppercase tracking-wider text-primary bg-background/90 px-3 py-1 rounded-full border border-primary/40 shadow-sm backdrop-blur-sm">
          {hoveredMuscle || selectedMuscle}
        </span>
      </div>

      <svg
        viewBox="0 0 300 480"
        className="w-full max-w-[240px] h-auto max-h-[380px] cursor-pointer transition-all"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {view === 'FRONT' ? (
          /* ======================================================== */
          /* FRONT ANATOMICAL BODY VECTOR                             */
          /* ======================================================== */
          <g className="transition-colors duration-200" strokeWidth="1.5">
            {/* Head / Neck Base (Neutral) */}
            <path
              d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 158 85, 150 85 C 142 85, 130 70, 130 50 Z"
              className="fill-muted/30 stroke-muted-foreground/30 pointer-events-none"
            />
            {/* Neck / Traps (Front) */}
            <path
              d="M 136 82 L 118 105 L 138 112 L 150 110 L 162 112 L 182 105 L 164 82 Z"
              className={`${getMuscleFill('Traps')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Traps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Shoulders')}
            />

            {/* Left Deltoid (Shoulder) */}
            <path
              d="M 116 106 C 96 112, 88 135, 92 155 C 98 162, 108 160, 114 150 C 118 138, 120 120, 116 106 Z"
              className={`${getMuscleFill('Shoulders')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Shoulders')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Shoulders')}
            />
            {/* Right Deltoid (Shoulder) */}
            <path
              d="M 184 106 C 204 112, 212 135, 208 155 C 202 162, 192 160, 186 150 C 182 138, 180 120, 184 106 Z"
              className={`${getMuscleFill('Shoulders')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Shoulders')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Shoulders')}
            />

            {/* Left Chest (Pectoral) */}
            <path
              d="M 148 112 L 122 115 C 114 135, 118 160, 148 165 C 149 148, 149 130, 148 112 Z"
              className={`${getMuscleFill('Chest')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Chest')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Chest')}
            />
            {/* Right Chest (Pectoral) */}
            <path
              d="M 152 112 L 178 115 C 186 135, 182 160, 152 165 C 151 148, 151 130, 152 112 Z"
              className={`${getMuscleFill('Chest')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Chest')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Chest')}
            />

            {/* Left Bicep */}
            <path
              d="M 91 157 C 86 172, 88 195, 98 205 C 104 205, 109 195, 112 180 C 114 165, 108 155, 91 157 Z"
              className={`${getMuscleFill('Biceps')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Biceps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Biceps')}
            />
            {/* Right Bicep */}
            <path
              d="M 209 157 C 214 172, 212 195, 202 205 C 196 205, 191 195, 188 180 C 186 165, 192 155, 209 157 Z"
              className={`${getMuscleFill('Biceps')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Biceps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Biceps')}
            />

            {/* Left Forearm */}
            <path
              d="M 97 207 C 88 225, 78 250, 72 270 C 76 274, 84 270, 92 255 C 98 240, 104 220, 104 207 Z"
              className={`${getMuscleFill('Forearms')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Forearms')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Biceps')}
            />
            {/* Right Forearm */}
            <path
              d="M 203 207 C 212 225, 222 250, 228 270 C 224 274, 216 270, 208 255 C 202 240, 196 220, 196 207 Z"
              className={`${getMuscleFill('Forearms')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Forearms')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Biceps')}
            />

            {/* Abdominals (Core Matrix) */}
            <path
              d="M 132 168 L 148 167 L 148 188 L 130 188 Z"
              className={`${getMuscleFill('Abs')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Abs')}
            />
            <path
              d="M 152 167 L 168 168 L 170 188 L 152 188 Z"
              className={`${getMuscleFill('Abs')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Abs')}
            />
            <path
              d="M 130 191 L 148 191 L 148 212 L 132 212 Z"
              className={`${getMuscleFill('Abs')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Abs')}
            />
            <path
              d="M 152 191 L 170 191 L 168 212 L 152 212 Z"
              className={`${getMuscleFill('Abs')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Abs')}
            />
            <path
              d="M 133 215 L 148 215 L 148 238 L 138 238 Z"
              className={`${getMuscleFill('Abs')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Abs')}
            />
            <path
              d="M 152 215 L 167 215 L 162 238 L 152 238 Z"
              className={`${getMuscleFill('Abs')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Abs')}
            />

            {/* Left Obliques */}
            <path
              d="M 120 168 C 118 195, 122 225, 130 240 L 135 215 L 128 175 Z"
              className={`${getMuscleFill('Abs')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Abs')}
            />
            {/* Right Obliques */}
            <path
              d="M 180 168 C 182 195, 178 225, 170 240 L 165 215 L 172 175 Z"
              className={`${getMuscleFill('Abs')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Abs')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Abs')}
            />

            {/* Left Quadriceps (Front Thigh) */}
            <path
              d="M 126 246 C 114 270, 112 315, 124 350 C 134 355, 144 340, 146 320 C 148 290, 148 265, 146 248 Z"
              className={`${getMuscleFill('Quads')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Quads')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Quads')}
            />
            {/* Right Quadriceps (Front Thigh) */}
            <path
              d="M 174 246 C 186 270, 188 315, 176 350 C 166 355, 156 340, 154 320 C 152 290, 152 265, 154 248 Z"
              className={`${getMuscleFill('Quads')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Quads')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Quads')}
            />

            {/* Knees (Neutral) */}
            <circle cx="132" cy="362" r="7" className="fill-muted/40 stroke-muted-foreground/30 pointer-events-none" />
            <circle cx="168" cy="362" r="7" className="fill-muted/40 stroke-muted-foreground/30 pointer-events-none" />

            {/* Left Calves (Front) */}
            <path
              d="M 124 374 C 116 395, 118 430, 126 450 C 132 452, 138 440, 140 420 C 142 395, 138 376, 136 374 Z"
              className={`${getMuscleFill('Calves')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Calves')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Calves')}
            />
            {/* Right Calves (Front) */}
            <path
              d="M 176 374 C 184 395, 182 430, 174 450 C 168 452, 162 440, 160 420 C 158 395, 162 376, 164 374 Z"
              className={`${getMuscleFill('Calves')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Calves')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Calves')}
            />
          </g>
        ) : (
          /* ======================================================== */
          /* BACK ANATOMICAL BODY VECTOR                              */
          /* ======================================================== */
          <g className="transition-colors duration-200" strokeWidth="1.5">
            {/* Head (Back View) */}
            <path
              d="M 130 50 C 130 30, 170 30, 170 50 C 170 70, 158 85, 150 85 C 142 85, 130 70, 130 50 Z"
              className="fill-muted/30 stroke-muted-foreground/30 pointer-events-none"
            />

            {/* Upper Traps / Neck (Back) */}
            <path
              d="M 136 82 L 118 105 L 140 120 L 150 145 L 160 120 L 182 105 L 164 82 Z"
              className={`${getMuscleFill('Back')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Back')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Back')}
            />

            {/* Left Rear Deltoid */}
            <path
              d="M 116 106 C 96 112, 88 135, 92 155 C 98 162, 108 160, 114 150 C 118 138, 120 120, 116 106 Z"
              className={`${getMuscleFill('Shoulders')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Shoulders')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Shoulders')}
            />
            {/* Right Rear Deltoid */}
            <path
              d="M 184 106 C 204 112, 212 135, 208 155 C 202 162, 192 160, 186 150 C 182 138, 180 120, 184 106 Z"
              className={`${getMuscleFill('Shoulders')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Shoulders')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Shoulders')}
            />

            {/* Left Latissimus Dorsi (Back / Lats) */}
            <path
              d="M 148 146 L 122 125 C 112 150, 118 190, 136 215 L 148 215 Z"
              className={`${getMuscleFill('Back')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Back')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Back')}
            />
            {/* Right Latissimus Dorsi (Back / Lats) */}
            <path
              d="M 152 146 L 178 125 C 188 150, 182 190, 164 215 L 152 215 Z"
              className={`${getMuscleFill('Back')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Back')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Back')}
            />

            {/* Left Tricep */}
            <path
              d="M 91 157 C 86 175, 88 198, 98 205 C 104 205, 109 195, 112 180 C 114 165, 108 155, 91 157 Z"
              className={`${getMuscleFill('Triceps')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Triceps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Triceps')}
            />
            {/* Right Tricep */}
            <path
              d="M 209 157 C 214 175, 212 198, 202 205 C 196 205, 191 195, 188 180 C 186 165, 192 155, 209 157 Z"
              className={`${getMuscleFill('Triceps')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Triceps')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Triceps')}
            />

            {/* Left Forearm (Back View) */}
            <path
              d="M 97 207 C 88 225, 78 250, 72 270 C 76 274, 84 270, 92 255 C 98 240, 104 220, 104 207 Z"
              className={`${getMuscleFill('Forearms')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Forearms')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Triceps')}
            />
            {/* Right Forearm (Back View) */}
            <path
              d="M 203 207 C 212 225, 222 250, 228 270 C 224 274, 216 270, 208 255 C 202 240, 196 220, 196 207 Z"
              className={`${getMuscleFill('Forearms')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Forearms')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Triceps')}
            />

            {/* Lower Back / Erector Spinae */}
            <path
              d="M 138 217 L 162 217 L 160 244 L 140 244 Z"
              className={`${getMuscleFill('Back')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Back')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Back')}
            />

            {/* Left Glute */}
            <path
              d="M 122 246 C 114 270, 120 295, 148 296 L 148 246 Z"
              className={`${getMuscleFill('Glutes')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Glutes')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Glutes')}
            />
            {/* Right Glute */}
            <path
              d="M 178 246 C 186 270, 180 295, 152 296 L 152 246 Z"
              className={`${getMuscleFill('Glutes')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Glutes')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Glutes')}
            />

            {/* Left Hamstring (Rear Thigh) */}
            <path
              d="M 122 300 C 114 320, 116 345, 124 358 C 134 358, 144 345, 146 325 C 148 305, 148 300, 146 300 Z"
              className={`${getMuscleFill('Hamstrings')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Hamstrings')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Hamstrings')}
            />
            {/* Right Hamstring (Rear Thigh) */}
            <path
              d="M 178 300 C 186 320, 184 345, 176 358 C 166 358, 156 345, 154 325 C 152 305, 152 300, 154 300 Z"
              className={`${getMuscleFill('Hamstrings')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Hamstrings')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Hamstrings')}
            />

            {/* Left Calves (Back View) */}
            <path
              d="M 122 374 C 114 395, 116 430, 126 450 C 132 452, 138 440, 140 420 C 142 395, 138 376, 136 374 Z"
              className={`${getMuscleFill('Calves')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Calves')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Calves')}
            />
            {/* Right Calves (Back View) */}
            <path
              d="M 178 374 C 186 395, 184 430, 174 450 C 168 452, 162 440, 160 420 C 158 395, 162 376, 164 374 Z"
              className={`${getMuscleFill('Calves')} transition-all`}
              onMouseEnter={() => setHoveredMuscle('Calves')}
              onMouseLeave={() => setHoveredMuscle(null)}
              onClick={() => onSelectMuscle('Calves')}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
