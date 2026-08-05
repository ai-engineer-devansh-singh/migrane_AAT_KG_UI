'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mode = 'public' | 'personal';

interface ModeSelectorProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-pill border border-hairline bg-canvas p-1">
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onChange('public')}
        className={cn(
          'rounded-pill',
          mode === 'public' && 'bg-surface-card text-ink shadow-sm hover:bg-surface-card'
        )}
      >
        Public (ICHD-3)
      </Button>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => onChange('personal')}
        className={cn(
          'rounded-pill',
          mode === 'personal' && 'bg-surface-card text-ink shadow-sm hover:bg-surface-card'
        )}
      >
        Personal (timeline)
      </Button>
    </div>
  );
}
