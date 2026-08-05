'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { fetchBenchmark, BenchmarkResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

const HYBRID = 'full_system_hybrid';
const STRICT = 'full_system';

const DIMENSIONS = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'hallucination', label: 'Hallucination' },
  { key: 'evidence', label: 'Evidence' },
  { key: 'safety', label: 'Safety' },
] as const;

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function meanFor(
  data: BenchmarkResponse,
  system: string,
  dim: 'accuracy' | 'hallucination' | 'evidence' | 'safety' | 'total'
): number | null {
  const vals = data.questions
    .map((q) => {
      const a = data.answers[system]?.[q.id];
      if (!a) return null;
      if (dim === 'total') return a.total_score;
      return a[`${dim}_score`];
    })
    .filter((v): v is number => typeof v === 'number');
  return mean(vals);
}

function Delta({ value, suffix = '' }: { value: number; suffix?: string }) {
  if (Number.isNaN(value) || Math.abs(value) < 1e-9) {
    return (
      <span className="inline-flex items-center gap-0.5 text-muted">
        <Minus className="h-3 w-3" /> 0{suffix}
      </span>
    );
  }
  const up = value > 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 font-medium',
        up ? 'text-brand-teal' : 'text-brand-coral'
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {up ? '+' : ''}
      {value.toFixed(2)}
      {suffix}
    </span>
  );
}

export default function AblationsPage() {
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBenchmark()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load benchmark'))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'Mean total CRS', hybrid: meanFor(data, HYBRID, 'total'), strict: meanFor(data, STRICT, 'total'), max: 12 },
      ...DIMENSIONS.map((d) => ({
        label: `Mean ${d.label.toLowerCase()}`,
        hybrid: meanFor(data, HYBRID, d.key),
        strict: meanFor(data, STRICT, d.key),
        max: 3,
      })),
    ];
  }, [data]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="space-y-2">
            <h1 className="font-display text-display-sm tracking-tight text-ink">
              Ablations
            </h1>
            <p className="text-body-md text-body">
              Hybrid (answers from established knowledge, citing KG facts) vs strict
              (KG facts only) retrieval mode. The delta shows how much parametric LLM
              knowledge contributes over pure KG retrieval, broken down by CRS dimension.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {data && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-title-sm text-ink">Hybrid vs strict</CardTitle>
                  <p className="text-caption text-muted">
                    Averaged over {data.total_questions} benchmark questions · max CRS shown per row.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-body-sm">
                      <thead>
                        <tr className="border-b border-hairline text-caption text-muted">
                          <th className="py-2 pr-4 text-left font-medium">Metric</th>
                          <th className="py-2 pr-4 text-right font-medium">Hybrid</th>
                          <th className="py-2 pr-4 text-right font-medium">Strict (KG-only)</th>
                          <th className="py-2 pr-4 text-right font-medium">Δ (hybrid − strict)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const delta =
                            r.hybrid != null && r.strict != null ? r.hybrid - r.strict : NaN;
                          return (
                            <tr key={r.label} className="border-b border-hairline last:border-0">
                              <td className="py-2 pr-4 text-body">{r.label}</td>
                              <td className="py-2 pr-4 text-right font-mono text-ink">
                                {r.hybrid != null ? `${r.hybrid.toFixed(2)} / ${r.max}` : '–'}
                              </td>
                              <td className="py-2 pr-4 text-right font-mono text-body">
                                {r.strict != null ? `${r.strict.toFixed(2)} / ${r.max}` : '–'}
                              </td>
                              <td className="py-2 pr-4 text-right">
                                {Number.isNaN(delta) ? (
                                  <span className="text-muted">–</span>
                                ) : (
                                  <Delta value={delta} />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-brand-teal">Hybrid = full_system_hybrid</Badge>
                    <Badge variant="outline">Strict = full_system</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-brand-ochre/30 bg-brand-ochre/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-title-sm text-ink">Deeper architecture ablations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-body-sm text-body">
                  <p>
                    The codebase supports component ablations via{' '}
                    <code className="rounded bg-surface-soft px-1 py-0.5 text-caption">run_ablations.py</code>:
                  </p>
                  <ul className="list-disc space-y-1 pl-5">
                    <li><strong>no_edge_features</strong> — GraphSAGE with edge attributes zeroed.</li>
                    <li><strong>no_gnn</strong> — raw ClinicalBERT 768-d embeddings, no GraphSAGE.</li>
                    <li><strong>no_assertions</strong> — assertion labels stripped from retrieved triples.</li>
                    <li><strong>no_temporal</strong> — temporal metadata stripped from retrieved triples.</li>
                    <li><strong>smaller_kg</strong> — only disease, symptom, and criterion nodes retained.</li>
                  </ul>
                  <p className="text-caption text-muted">
                    These require a Neo4j-backed run and write to{' '}
                    <code className="rounded bg-surface-soft px-1 py-0.5">results/ablations/</code>.
                    Run the script and this page can surface those results once present.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}