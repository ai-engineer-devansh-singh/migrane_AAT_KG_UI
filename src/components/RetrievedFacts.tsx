'use client';

import { useState } from 'react';
import { RetrievedFact } from '@/lib/api';
import { TripleBadge } from './TripleBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface RetrievedFactsProps {
  facts: RetrievedFact[];
  tripleCount: number;
  retrievalTimeMs: number;
  assertionFilter: string | null;
  temporalFocus: string | null;
  filterNodeId?: string | null;
}

const BRAND_ACCENT_CLASSES = [
  'bg-brand-pink/10 border-brand-pink/20',
  'bg-brand-lavender/10 border-brand-lavender/20',
  'bg-brand-peach/10 border-brand-peach/20',
  'bg-brand-ochre/10 border-brand-ochre/20',
  'bg-brand-mint/10 border-brand-mint/20',
  'bg-brand-coral/10 border-brand-coral/20',
];

export function RetrievedFacts({
  facts,
  tripleCount,
  retrievalTimeMs,
  assertionFilter,
  temporalFocus,
  filterNodeId,
}: RetrievedFactsProps) {
  const [expanded, setExpanded] = useState(true);

  const displayFacts = filterNodeId
    ? facts.filter(
        (f) =>
          f.source === filterNodeId ||
          f.target === filterNodeId ||
          f.source_name === filterNodeId ||
          f.target_name === filterNodeId
      )
    : facts;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-title-sm">Retrieved facts</CardTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setExpanded(!expanded)}
            className="text-muted-soft hover:text-ink"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-caption text-muted">
          {displayFacts.length} of {tripleCount} triples · {retrievalTimeMs.toFixed(0)} ms
          {assertionFilter ? ` · filter: ${assertionFilter}` : ''}
          {temporalFocus ? ` · focus: ${temporalFocus}` : ''}
          {filterNodeId ? ` · node: ${filterNodeId}` : ''}
        </p>
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0">
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="space-y-2 pr-3">
              {displayFacts.map((fact, i) => {
                const accentClass = BRAND_ACCENT_CLASSES[i % BRAND_ACCENT_CLASSES.length];
                return (
                  <div
                    key={i}
                    className={cn(
                      'rounded-md border p-3 text-sm',
                      accentClass
                    )}
                  >
                    <div className="font-medium text-ink">
                      <span className="mr-1 text-caption text-muted-soft">[{i + 1}]</span>
                      {fact.source_name}
                    </div>
                    <div className="text-caption text-body">
                      [{fact.rel_type}] → {fact.target_name}
                    </div>
                    <div className="mt-1">
                      <TripleBadge
                        assertion={fact.assertion}
                        temporal={fact.temporal}
                        required={fact.required}
                      />
                    </div>
                    {fact.source_ref && (
                      <div className="mt-1 truncate text-[10px] text-muted-soft" title={`provenance: ${fact.source_ref}`}>
                        <span className="text-muted">source:</span>{' '}
                        <span className="font-mono">{fact.source_ref}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
}
