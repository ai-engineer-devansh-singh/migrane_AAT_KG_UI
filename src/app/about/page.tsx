'use client';

import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-2">
            <h1 className="font-display text-display-sm tracking-tight text-ink">
              About MigraineAAT-KG
            </h1>
            <p className="text-body-md text-body">
              An assertion-aware, temporal knowledge-graph QA system for migraine information.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-title-sm text-ink">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-body-sm text-body">
              <div className="overflow-x-auto rounded-xl border border-hairline bg-surface-soft p-2">
                <svg
                  viewBox="0 0 760 300"
                  role="img"
                  aria-label="MigraineAAT-KG architecture pipeline"
                  className="h-auto w-full min-w-[640px]"
                >
                  <title>MigraineAAT-KG architecture pipeline</title>
                  <desc>
                    ICHD-3 PDF, NICE CG150, and synthetic patient timelines feed a Neo4j
                    knowledge graph of ICHD3Entity nodes with assertion, temporal, and
                    source edges. ClinicalBERT produces 768-dim node features; 7-dim edge
                    features feed an edge-aware GraphSAGE that yields 128-dim learned
                    embeddings; a ridge projection maps the question into that space for
                    learned retrieval. A ranked subgraph is passed to Grok for generation.
                  </desc>

                  {/* Column headers */}
                  <text x={80} y={22} textAnchor="middle" className="fill-muted" fontSize="11" fontWeight="700">SOURCES</text>
                  <text x={250} y={22} textAnchor="middle" className="fill-muted" fontSize="11" fontWeight="700">KNOWLEDGE GRAPH</text>
                  <text x={440} y={22} textAnchor="middle" className="fill-muted" fontSize="11" fontWeight="700">ML PIPELINE</text>
                  <text x={640} y={22} textAnchor="middle" className="fill-muted" fontSize="11" fontWeight="700">RUNTIME</text>

                  {/* Sources column */}
                  <g>
                    <rect x={20} y={40} width={120} height={34} rx={6} className="fill-brand-pink/20 stroke-brand-pink/40" />
                    <text x={80} y={62} textAnchor="middle" className="fill-ink" fontSize="11">ICHD-3 PDF</text>
                    <rect x={20} y={86} width={120} height={34} rx={6} className="fill-brand-peach/30 stroke-brand-peach/50" />
                    <text x={80} y={108} textAnchor="middle" className="fill-ink" fontSize="11">NICE CG150</text>
                    <rect x={20} y={132} width={120} height={34} rx={6} className="fill-brand-lavender/25 stroke-brand-lavender/50" />
                    <text x={80} y={154} textAnchor="middle" className="fill-ink" fontSize="11">Synthetic timelines</text>
                  </g>

                  {/* KG column */}
                  <g>
                    <rect x={190} y={70} width={120} height={66} rx={6} className="fill-brand-teal/15 stroke-brand-teal/45" />
                    <text x={250} y={92} textAnchor="middle" className="fill-ink" fontSize="11" fontWeight="600">Neo4j KG</text>
                    <text x={250} y={108} textAnchor="middle" className="fill-muted" fontSize="10">ICHD3Entity nodes</text>
                    <text x={250} y={122} textAnchor="middle" className="fill-muted" fontSize="10">assertion · temporal · source</text>
                  </g>

                  {/* ML pipeline column */}
                  <g>
                    <rect x={360} y={40} width={160} height={30} rx={6} className="fill-brand-mint/25 stroke-brand-mint/50" />
                    <text x={440} y={59} textAnchor="middle" className="fill-ink" fontSize="11">ClinicalBERT 768-d</text>
                    <rect x={360} y={78} width={160} height={30} rx={6} className="fill-brand-mint/25 stroke-brand-mint/50" />
                    <text x={440} y={97} textAnchor="middle" className="fill-ink" fontSize="11">7-dim edge features</text>
                    <rect x={360} y={116} width={160} height={30} rx={6} className="fill-brand-teal/20 stroke-brand-teal/45" />
                    <text x={440} y={135} textAnchor="middle" className="fill-ink" fontSize="11">Edge-aware GraphSAGE</text>
                    <rect x={360} y={154} width={160} height={30} rx={6} className="fill-brand-teal/20 stroke-brand-teal/45" />
                    <text x={440} y={173} textAnchor="middle" className="fill-ink" fontSize="11">128-d learned embeddings</text>
                    <rect x={360} y={192} width={160} height={30} rx={6} className="fill-brand-ochre/25 stroke-brand-ochre/50" />
                    <text x={440} y={211} textAnchor="middle" className="fill-ink" fontSize="11">Ridge 768→128 projection</text>
                  </g>

                  {/* Runtime column */}
                  <g>
                    <rect x={580} y={70} width={140} height={30} rx={6} className="fill-surface-card stroke-hairline" />
                    <text x={650} y={89} textAnchor="middle" className="fill-ink" fontSize="11">Question</text>
                    <rect x={580} y={108} width={140} height={30} rx={6} className="fill-brand-pink/20 stroke-brand-pink/40" />
                    <text x={650} y={127} textAnchor="middle" className="fill-ink" fontSize="11">Learned retrieval</text>
                    <rect x={580} y={146} width={140} height={30} rx={6} className="fill-brand-lavender/25 stroke-brand-lavender/50" />
                    <text x={650} y={165} textAnchor="middle" className="fill-ink" fontSize="11">Subgraph ranking</text>
                    <rect x={580} y={184} width={140} height={30} rx={6} className="fill-brand-mint/30 stroke-brand-mint/55" />
                    <text x={650} y={203} textAnchor="middle" className="fill-ink" fontSize="11">Grok generation</text>
                    <rect x={580} y={222} width={140} height={30} rx={6} className="fill-brand-teal/25 stroke-brand-teal/50" />
                    <text x={650} y={241} textAnchor="middle" className="fill-ink" fontSize="11" fontWeight="600">Answer</text>
                  </g>

                  {/* Arrows: sources -> KG */}
                  <g stroke="currentColor" strokeWidth="1.5" className="text-muted" markerEnd="url(#arrow)">
                    <line x1={140} y1={57} x2={188} y2={92} />
                    <line x1={140} y1={103} x2={188} y2={103} />
                    <line x1={140} y1={149} x2={188} y2={114} />
                  </g>
                  {/* KG -> ML */}
                  <line x1={310} y1={92} x2={358} y2={55} stroke="currentColor" strokeWidth="1.5" className="text-muted" markerEnd="url(#arrow)" />
                  <line x1={310} y1={114} x2={358} y2={93} stroke="currentColor" strokeWidth="1.5" className="text-muted" markerEnd="url(#arrow)" />
                  {/* ML internal flow */}
                  <g stroke="currentColor" strokeWidth="1.5" className="text-muted" markerEnd="url(#arrow)">
                    <line x1={440} y1={70} x2={440} y2={76} />
                    <line x1={440} y1={108} x2={440} y2={114} />
                    <line x1={440} y1={146} x2={440} y2={152} />
                    <line x1={440} y1={184} x2={440} y2={190} />
                  </g>
                  {/* ML -> Runtime */}
                  <line x1={520} y1={207} x2={578} y2={123} stroke="currentColor" strokeWidth="1.5" className="text-muted" markerEnd="url(#arrow)" />
                  {/* KG -> retrieval (direct) */}
                  <line x1={310} y1={120} x2={578} y2={123} stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" className="text-muted" markerEnd="url(#arrow)" />
                  {/* Runtime internal flow */}
                  <g stroke="currentColor" strokeWidth="1.5" className="text-muted" markerEnd="url(#arrow)">
                    <line x1={650} y1={100} x2={650} y2={106} />
                    <line x1={650} y1={138} x2={650} y2={144} />
                    <line x1={650} y1={176} x2={650} y2={182} />
                    <line x1={650} y1={214} x2={650} y2={220} />
                  </g>

                  <defs>
                    <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L6,3 L0,6 Z" className="fill-muted" />
                    </marker>
                  </defs>
                </svg>
              </div>

              <ol className="list-decimal space-y-3 pl-5">
                <li>
                  <strong>Knowledge graph:</strong> ICHD-3 diagnostic criteria and NICE CG150 treatment guidance are
                  structured as nodes and edges in Neo4j. Every edge carries an assertion
                  (present / absent / possible), temporal metadata, and a provenance source.
                </li>
                <li>
                  <strong>Node features:</strong> ClinicalBERT encodes each node name into a 768-dimensional vector.
                </li>
                <li>
                  <strong>Graph learning:</strong> An edge-aware GraphSAGE model is trained on link-prediction tasks and
                  produces 128-dimensional learned embeddings that capture graph structure.
                </li>
                <li>
                  <strong>Retrieval projection:</strong> A ridge regression maps the 768-dim ClinicalBERT question
                  embedding into the 128-dim GraphSAGE space so retrieval scores against the
                  learned embeddings.
                </li>
                <li>
                  <strong>Answer generation:</strong> Grok receives the ranked subgraph facts. In hybrid mode the
                  system answers from established medical knowledge and cites KG facts where
                  they support the answer; in strict mode it only uses provided facts.
                </li>
                <li>
                  <strong>Personal mode:</strong> Synthetic patient timelines are stored in Neo4j and combined with
                  public clinical criteria for longitudinal, patient-specific answers.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-title-sm text-ink">Who uses this and why</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-body-sm text-body">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 rounded-xl border border-hairline bg-surface-card p-4">
                  <div className="flex items-center gap-2 text-ink">
                    <Info className="h-4 w-4 text-brand-teal" />
                    <span className="font-semibold">Patients and public</span>
                  </div>
                  <p>
                    Get trustworthy, source-cited migraine information instead of relying on
                    hallucinating chatbots for clinical facts.
                  </p>
                </div>
                <div className="space-y-2 rounded-xl border border-hairline bg-surface-card p-4">
                  <div className="flex items-center gap-2 text-ink">
                    <CheckCircle2 className="h-4 w-4 text-brand-teal" />
                    <span className="font-semibold">Clinicians, researchers, and health-tech developers</span>
                  </div>
                  <p>
                    Reuse the assertion-aware temporal KG and learned-retrieval method for
                    other clinical domains or as a reproducible research baseline.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-brand-coral/20 bg-brand-coral/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-title-sm text-brand-coral">
                <AlertTriangle className="h-4 w-4" />
                Explicit non-goals
              </CardTitle>
            </CardHeader>
            <CardContent className="text-body-sm text-body">
              <ul className="list-disc space-y-1 pl-5">
                <li>This is a research prototype, not a diagnostic or medical-advice service.</li>
                <li>Patient data is synthetic; no real patient records are used.</li>
                <li>It does not replace consultation with a qualified clinician.</li>
                <li>Coverage is limited to ICHD-3 migraine criteria and selected NICE guidance.</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-title-sm text-ink">SOTA positioning</CardTitle>
            </CardHeader>
            <CardContent className="text-body-sm text-body">
              <p>
                The project aligns with the 2026 frontier in clinical GraphRAG: assertion-aware
                retrieval (ClinicalBench / EpiKG), temporally-grounded medical KG evaluation
                (ChronoMedKG), and provenance-aware citation (HEG-TKG). The live system is
                intentionally small-scale and honest about its limitations; the code and
                benchmark are open for reuse and extension.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
