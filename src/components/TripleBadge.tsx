'use client';

interface TripleBadgeProps {
  assertion?: string | null;
  temporal?: string | null;
  required?: boolean | null;
}

export function TripleBadge({ assertion, temporal, required }: TripleBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {assertion && (
        <span
          className={[
            'inline-flex h-5 items-center rounded-pill px-2 text-caption capitalize',
            assertion === 'present' && 'bg-brand-teal text-on-dark',
            assertion === 'absent' && 'bg-brand-coral text-on-dark',
            assertion === 'possible' && 'bg-brand-ochre text-ink',
            !['present', 'absent', 'possible'].includes(assertion) &&
              'border border-hairline bg-canvas text-body',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {assertion}
        </span>
      )}
      {required && (
        <span className="inline-flex h-5 items-center rounded-pill border border-hairline bg-canvas px-2 text-caption text-body">
          required
        </span>
      )}
      {temporal && (
        <span
          className="max-w-[200px] truncate text-[10px] text-muted-soft"
          title={temporal}
        >
          {temporal}
        </span>
      )}
    </div>
  );
}
