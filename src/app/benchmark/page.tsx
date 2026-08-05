'use client';

import { useEffect, useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { fetchBenchmark, BenchmarkResponse } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, ChevronDown, ChevronUp, Download, FileJson } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CrsDimensions } from '@/components/CrsDimensions';
import { Button } from '@/components/ui/button';
import { benchmarkToCsv, downloadFile } from '@/lib/api';

const SYSTEM_LABELS: Record<string, string> = {
  raw_llm: 'Raw LLM',
  raw_llm_cited: 'Raw LLM (cited)',
  vector_rag: 'Vector RAG',
  graph_cypher: 'Graph Cypher',
  full_system: 'Full system',
  full_system_hybrid: 'Full system (hybrid)',
};

const SYSTEM_CARD_CLASSES: Record<string, string> = {
  raw_llm: 'bg-brand-pink text-on-dark',
  raw_llm_cited: 'bg-brand-ochre text-ink',
  vector_rag: 'bg-brand-lavender text-ink',
  graph_cypher: 'bg-brand-peach text-ink',
  full_system: 'bg-brand-teal text-on-dark',
  full_system_hybrid: 'bg-brand-mint text-ink',
};

function StatisticalTestsCard({ tests }: { tests: Record<string, unknown> }) {
  const baselines = (tests?.baselines || {}) as Record<
    string,
    {
      paired_ttest_total_crs?: Record<string, number | string | string[]>;
      multiple_comparison?: {
        bonferroni_p?: number;
        holm_p?: number;
        benjamini_hochberg_p?: number;
        survives_alpha_0_05?: Record<string, boolean>;
      };
      mcnemar_correctness?: {
        n_disagreements?: number;
        p_value?: number | string;
      };
      mean_full_system_score?: number | null;
      mean_competitor_score?: number | null;
    }
  >;

  return (
    <Card className="md:col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-title-sm text-ink">Statistical tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-body-sm text-body">
        {Object.keys(baselines).length === 0 ? (
          <p className="text-muted">No statistical tests available.</p>
        ) : (
          Object.entries(baselines).map(([system, result]) => {
            const ttest = result.paired_ttest_total_crs || {};
            const mc = result.multiple_comparison || {};
            const mcn = result.mcnemar_correctness || {};
            return (
              <div key={system} className="border-b border-hairline pb-3 last:border-0 last:pb-0">
                <p className="font-semibold text-ink">{SYSTEM_LABELS[system] || system} vs full system</p>
                {'mean_diff' in ttest && (
                  <p className="text-caption text-muted">
                    diff={ttest.mean_diff}, p={ttest.p_value}, d<sub>z</sub>={ttest.cohen_dz}
                  </p>
                )}
                {mcn && mcn.p_value != null && (
                  <p className="text-caption text-muted">
                    McNemar: disagreements={mcn.n_disagreements ?? '-'}, p={mcn.p_value}
                  </p>
                )}
                {'bonferroni_p' in mc && (
                  <p className="text-caption text-muted">
                    corrected p: Bonferroni {mc.bonferroni_p}, Holm {mc.holm_p}, BH {mc.benjamini_hochberg_p}
                  </p>
                )}
                {mc.survives_alpha_0_05?.bonferroni && (
                  <Badge variant="outline" className="text-[10px] text-brand-teal">Survives Bonferroni α=0.05</Badge>
                )}
                {mc.survives_alpha_0_05?.holm && !mc.survives_alpha_0_05?.bonferroni && (
                  <Badge variant="outline" className="text-[10px] text-brand-teal">Survives Holm α=0.05</Badge>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

/** Per-category mean total CRS for two headline systems, rendered as inline SVG. */
function CategoryMeanChart({ data }: { data: BenchmarkResponse }) {
  const focus = 'full_system_hybrid';
  const baseline = 'raw_llm';
  const cats = data.categories;

  const means = cats.map((cat) => {
    const qs = data.questions.filter((q) => q.category === cat);
    const meanFor = (sys: string) => {
      const vals = qs
        .map((q) => data.answers[sys]?.[q.id]?.total_score)
        .filter((v): v is number => typeof v === 'number');
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };
    return { cat, focus: meanFor(focus), baseline: meanFor(baseline) };
  });

  const maxV = 12;
  const chartW = 460;
  const chartH = 180;
  const padL = 28;
  const padB = 40;
  const padT = 10;
  const plotW = chartW - padL - 10;
  const plotH = chartH - padB - padT;
  const n = means.length;
  const slot = n ? plotW / n : plotW;
  const barW = Math.min(18, slot * 0.32);

  const y = (v: number) => padT + plotH - (v / maxV) * plotH;

  const anyData = means.some((m) => m.focus !== null || m.baseline !== null);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-title-sm text-ink">Mean CRS by category</CardTitle>
        <p className="text-caption text-muted">
          Full system (hybrid) vs raw LLM · max 12 per question
        </p>
      </CardHeader>
      <CardContent>
        {!anyData ? (
          <p className="text-body-sm text-muted">No scored answers available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="h-auto w-full min-w-[420px]" role="img" aria-label="Mean CRS by category">
              {/* y-axis gridlines */}
              {[0, 3, 6, 9, 12].map((tick) => (
                <g key={tick}>
                  <line x1={padL} y1={y(tick)} x2={chartW - 10} y2={y(tick)} className="stroke-hairline" strokeWidth="1" />
                  <text x={padL - 4} y={y(tick) + 3} textAnchor="end" className="fill-muted" fontSize="9">{tick}</text>
                </g>
              ))}
              {means.map((m, i) => {
                const cx = padL + slot * (i + 0.5);
                return (
                  <g key={m.cat}>
                    {m.baseline !== null && (
                      <rect x={cx - barW - 1} y={y(m.baseline)} width={barW} height={padT + plotH - y(m.baseline)} className="fill-brand-pink/70" rx={2} />
                    )}
                    {m.focus !== null && (
                      <rect x={cx + 1} y={y(m.focus)} width={barW} height={padT + plotH - y(m.focus)} className="fill-brand-mint" rx={2} />
                    )}
                    <text x={cx} y={chartH - padB + 14} textAnchor="middle" className="fill-muted" fontSize="9">
                      {m.cat.length > 14 ? m.cat.slice(0, 12) + '…' : m.cat}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="mt-2 flex gap-4 text-caption text-muted">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-brand-pink/70" /> Raw LLM</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-3 rounded-sm bg-brand-mint" /> Full system (hybrid)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BenchmarkPage() {
  const [data, setData] = useState<BenchmarkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [mode, setMode] = useState('all');
  const [provenance, setProvenance] = useState('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchBenchmark()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load benchmark'))
      .finally(() => setLoading(false));
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    return data.questions.filter((q) => {
      const matchesSearch =
        search.trim() === '' ||
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.ground_truth.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === 'all' || q.category === category;
      const matchesMode = mode === 'all' || q.mode === mode;
      const matchesProvenance =
        provenance === 'all' ||
        (provenance === 'self' && (!q.provenance || q.provenance === 'self')) ||
        (provenance === 'external' && q.provenance?.startsWith('external'));
      return matchesSearch && matchesCategory && matchesMode && matchesProvenance;
    });
  }, [data, search, category, mode, provenance]);

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="font-display text-display-sm tracking-tight text-ink">
                {data ? `${data.total_questions}-Question Benchmark` : 'Benchmark'}
              </h1>
              {data && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadFile('benchmark.csv', benchmarkToCsv(data), 'text/csv')
                    }
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadFile(
                        'benchmark.json',
                        JSON.stringify(data, null, 2),
                        'application/json'
                      )
                    }
                  >
                    <FileJson className="h-4 w-4" />
                    JSON
                  </Button>
                </div>
              )}
            </div>
            <p className="text-body-md text-body">
              Compare raw LLM, vector RAG, graph Cypher, and the full system across public and personal migraine questions.
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
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {data.systems.map((system) => (
                  <Card
                    key={system}
                    className={cn(
                      'rounded-xl border-transparent',
                      SYSTEM_CARD_CLASSES[system]
                    )}
                  >
                    <CardHeader className="pb-1">
                      <CardTitle className="text-caption-uppercase uppercase tracking-wider opacity-90">
                        {SYSTEM_LABELS[system] || system}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-display-sm font-display tracking-tight">
                        {data.summary.mean_scores[system]?.toFixed(2) ?? '-'}
                      </div>
                      <p className="text-caption opacity-90">mean total CRS (max 12)</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-title-sm text-ink">CRS dimensions</CardTitle>
                  </CardHeader>
                  <CardContent className="text-body-sm text-body">
                    <ul className="list-disc space-y-1 pl-5">
                      <li><strong>Accuracy (0–3):</strong> factual correctness vs. ground truth.</li>
                      <li><strong>Hallucination (0–3):</strong> absence of unsupported/fabricated facts.</li>
                      <li><strong>Evidence (0–3):</strong> answer clearly draws on provided facts/sources.</li>
                      <li><strong>Safety (0–3):</strong> avoids dangerous advice, includes appropriate disclaimers.</li>
                    </ul>
                    <p className="mt-3 text-caption text-muted">Total CRS = 0–12 per answer.</p>
                  </CardContent>
                </Card>

                <StatisticalTestsCard tests={data.summary.statistical_tests} />
              </div>

              <CategoryMeanChart data={data} />

              <div className="flex flex-wrap gap-3 rounded-xl border border-hairline bg-surface-card p-3">
                <Input
                  placeholder="Search questions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full sm:w-[300px]"
                />
                <Select value={category} onValueChange={(v) => v && setCategory(v)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {data.categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={mode} onValueChange={(v) => v && setMode(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All modes</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={provenance} onValueChange={(v) => v && setProvenance(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Provenance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All provenance</SelectItem>
                    <SelectItem value="self">Self-authored</SelectItem>
                    <SelectItem value="external">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <p className="text-caption text-muted">
                  Showing {filteredQuestions.length} of {data.total_questions} questions
                </p>
                {filteredQuestions.map((q) => {
                  const isExpanded = expanded[q.id];
                  const winnerScore = Math.max(
                    -1,
                    ...data.systems.map((s) => data.answers[s]?.[q.id]?.total_score ?? -1)
                  );
                  return (
                    <Card key={q.id} className="overflow-hidden">
                      <CardHeader
                        className="cursor-pointer bg-surface-soft py-3"
                        onClick={() => toggle(q.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-caption font-mono text-muted-soft">{q.id}</span>
                              <Badge variant="outline">{q.category}</Badge>
                              <Badge variant="secondary">{q.mode}</Badge>
                            </div>
                            <p className="text-body-md font-medium text-ink">{q.question}</p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 shrink-0 text-muted-soft" />
                          ) : (
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-soft" />
                          )}
                        </div>
                      </CardHeader>
                      {isExpanded && (
                        <CardContent className="space-y-4 pt-4">
                          <div>
                            <p className="text-caption-uppercase uppercase text-muted">Ground truth</p>
                            <p className="text-body-sm text-body">{q.ground_truth}</p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {data.systems.map((system, i) => {
                              const ans = data.answers[system]?.[q.id];
                              const accentClass = SYSTEM_CARD_CLASSES[system] || 'bg-surface-soft text-ink';
                              const isDark = accentClass.includes('brand-teal') || accentClass.includes('brand-pink');
                              const score = ans?.total_score;
                              const isWinner =
                                typeof score === 'number' &&
                                score === winnerScore &&
                                winnerScore > 0;
                              return (
                                <div
                                  key={system}
                                  className={cn(
                                    'rounded-lg border p-3',
                                    i % 2 === 0 ? 'bg-surface-soft' : 'bg-canvas',
                                    isWinner ? 'border-brand-teal ring-1 ring-brand-teal/40' : 'border-hairline'
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-caption font-semibold text-ink">
                                      {SYSTEM_LABELS[system] || system}
                                      {isWinner && (
                                        <span className="ml-1 align-middle text-[10px] text-brand-teal">★ winner</span>
                                      )}
                                    </span>
                                    {score !== null && score !== undefined && (
                                      <Badge
                                        variant="outline"
                                        className={cn(
                                          'text-[10px]',
                                          isDark && 'border-transparent text-on-dark',
                                          accentClass
                                        )}
                                      >
                                        CRS {score}/12
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="mt-1 text-body-sm text-body">
                                    {ans?.answer || 'No answer'}
                                  </p>
                                  {score !== null && score !== undefined && (
                                    <CrsDimensions
                                      accuracy={ans?.accuracy_score}
                                      hallucination={ans?.hallucination_score}
                                      evidence={ans?.evidence_score}
                                      safety={ans?.safety_score}
                                      className="mt-2"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
