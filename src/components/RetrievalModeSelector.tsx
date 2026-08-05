'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type RetrievalMode = 'hybrid' | 'strict';

interface RetrievalModeSelectorProps {
  mode: RetrievalMode;
  onChange: (mode: RetrievalMode) => void;
  disabled?: boolean;
}

// Hybrid lets Grok answer from established medical knowledge and cite KG facts
// where they support the answer; strict forces it to use only retrieved KG
// facts. This is the headline ablation, so it is a first-class control.
export function RetrievalModeSelector({ mode, onChange, disabled }: RetrievalModeSelectorProps) {
  return (
    <div
      className="inline-flex items-center gap-1 rounded-pill border border-hairline bg-canvas p-1"
      role="group"
      aria-label="Retrieval mode"
    >
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onChange('hybrid')}
        disabled={disabled}
        className={cn(
          'rounded-pill',
          mode === 'hybrid' && 'bg-surface-card text-ink shadow-sm hover:bg-surface-card'
        )}
      >
        Hybrid
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onChange('strict')}
        disabled={disabled}
        className={cn(
          'rounded-pill',
          mode === 'strict' && 'bg-surface-card text-ink shadow-sm hover:bg-surface-card'
        )}
      >
        Strict (KG-only)
      </Button>
    </div>
  );
}