'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Play,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Wind,
  ShieldCheck,
  Dumbbell,
  BookOpen,
} from 'lucide-react';
import { generateExerciseFormGuide, type FormGuideData } from '@/lib/utils/youtube';

interface FormVideoGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  primaryMuscle?: string | null;
  videoUrl?: string | null;
  instructions?: string[];
}

export function FormVideoGuideModal({
  isOpen,
  onClose,
  exerciseName,
  primaryMuscle,
  videoUrl,
  instructions,
}: FormVideoGuideModalProps) {
  const [activeTab, setActiveTab] = useState<'VIDEO' | 'STEPS' | 'MISTAKES' | 'BREATHING'>('VIDEO');

  if (!isOpen) return null;

  const formGuide: FormGuideData = generateExerciseFormGuide(exerciseName, primaryMuscle, videoUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base sm:text-lg text-foreground">{exerciseName}</h3>
                {primaryMuscle && (
                  <Badge variant="secondary" className="text-[10px]">
                    {primaryMuscle}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Form Execution & Technique Guide</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Close form guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-border/70 px-4 bg-background/50 text-xs font-semibold overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('VIDEO')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'VIDEO'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Video Tutorial
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STEPS')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'STEPS'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Execution & Cues
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('MISTAKES')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'MISTAKES'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Common Mistakes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BREATHING')}
            className={`py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'BREATHING'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wind className="h-3.5 w-3.5" />
            Breathing & Safety
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: VIDEO TUTORIAL */}
          {activeTab === 'VIDEO' && (
            <div className="space-y-4">
              <div className="aspect-video w-full rounded-lg overflow-hidden border border-border bg-black/80 shadow-md">
                <iframe
                  src={formGuide.youtubeEmbedUrl}
                  title={`${exerciseName} Exercise Tutorial`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-lg border border-border/70 bg-muted/20 text-xs">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-red-500 fill-current" />
                  <span className="text-muted-foreground">
                    Watch in-depth tutorial & form breakdowns on YouTube
                  </span>
                </div>

                <a
                  href={formGuide.youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline shrink-0"
                >
                  <span>Open in YouTube</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: EXECUTION & SETUP CUES */}
          {activeTab === 'STEPS' && (
            <div className="space-y-4 text-xs">
              {/* Setup Checklist */}
              <div className="space-y-2">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  1. Setup & Posture Checklist
                </h4>
                <div className="space-y-1.5 pl-2">
                  {formGuide.setupCues.map((cue, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                      <span className="font-bold text-primary shrink-0">#{idx + 1}</span>
                      <span className="text-foreground/90 leading-relaxed">{cue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Cues */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                  <BookOpen className="h-4 w-4 text-emerald-500" />
                  2. Rep Execution Cues
                </h4>
                <div className="space-y-1.5 pl-2">
                  {(instructions && instructions.length > 0 ? instructions : formGuide.executionCues).map(
                    (cue, idx) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                        <span className="font-bold text-emerald-500 shrink-0">Step {idx + 1}:</span>
                        <span className="text-foreground/90 leading-relaxed">{cue}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COMMON MISTAKES */}
          {activeTab === 'MISTAKES' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-foreground flex items-center gap-1.5 text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Critical Mistakes to Avoid
              </h4>
              <p className="text-muted-foreground text-[11px]">
                Avoiding these errors protects joints from strain and ensures the target muscle receives maximum tension.
              </p>

              <div className="space-y-2 pt-1">
                {formGuide.commonMistakes.map((mistake, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive-foreground"
                  >
                    <span className="font-bold text-destructive shrink-0">✕</span>
                    <span className="text-foreground/90 font-medium">{mistake}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BREATHING & SAFETY */}
          {activeTab === 'BREATHING' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-lg border border-blue-500/30 bg-blue-500/5 space-y-1.5">
                <h4 className="font-bold text-blue-400 flex items-center gap-1.5 text-sm">
                  <Wind className="h-4 w-4" />
                  Breathing Cadence
                </h4>
                <p className="text-foreground/90 leading-relaxed">{formGuide.breathingTip}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-sm">Mind-Muscle & Eccentric Control</h4>
                <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground leading-relaxed">
                  <li>
                    <strong className="text-foreground">2-3s Eccentric Tempo:</strong> Resist the weight during the lowering phase to maximize hypertrophic micro-damage.
                  </li>
                  <li>
                    <strong className="text-foreground">Full Stretch & Contraction:</strong> Ensure full range without locking joints harshly under heavy load.
                  </li>
                  <li>
                    <strong className="text-foreground">Progressive Overload:</strong> Prioritize crisp, clean technique before increasing the load.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-border bg-muted/10 flex items-center justify-between">
          <a
            href={formGuide.youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <span>Search more videos</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <Button size="sm" onClick={onClose} className="text-xs font-semibold px-4 h-8">
            Got It
          </Button>
        </div>
      </div>
    </div>
  );
}
