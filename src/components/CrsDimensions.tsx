'use client';

import { cn } from '@/lib/utils';

interface CrsDimensionsProps {
  accuracy?: number | null;
  hallucination?: number | null;
  evidence?: number | null;
  safety?: number | null;
  className?: string;
}

// CRS rubric dimensions, each scored 0-3. Order matches the benchmark legend.
const DIMENSIONS = [
  { key: 'accuracy', label: 'Acc', color: 'bg-brand-teal' },
  { key: 'hallucination', label: 'Halluc', color: 'bg-brand-coral' },
  { key: 'evidence', label: 'Evid', color: 'bg-brand-lavender' },
  { key: 'safety', label: 'Safety', color: 'bg-brand-mint' },
] as const;

const MAX = 3;

/** Four-segment mini-bars showing the per-dimension CRS breakdown (each 0–3). */
export function CrsDimensions({
  accuracy,
  hallucination,
  evidence,
  safety,
  className,
}: CrsDimensionsProps) {
  const values: Record<string, number | null | undefined> = {
    accuracy,
    hallucination,
    evidence,
    safety,
  };
  const anyScored = DIMENSIONS.some((d) => values[d.key] != null);

  if (!anyScored) {
    return <p className="text-[10px] text-muted-soft">Not scored</p>;
  }

  return (
    <div className={cn('space-y-1', className)}>
      {DIMENSIONS.map((d) => {
        const v = values[d.key];
        const filled = typeof v === 'number' ? Math.max(0, Math.min(MAX, v)) : 0;
        const known = v != null;
        return (
          <div key={d.key} className="flex items-center gap-2">
            <span className="w-12 shrink-0 text-[10px] text-muted">{d.label}</span>
            <div className="flex flex-1 gap-0.5">
              {Array.from({ length: MAX }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 flex-1 rounded-sm',
                    known && i < filled ? d.color : 'bg-surface-strong'
                  )}
                />
              ))}
            </div>
            <span className="w-6 shrink-0 text-right font-mono text-[10px] text-body">
              {known ? `${filled}/${MAX}` : '–'}
            </span>
          </div>
        );
      })}
    </div>
  );
}