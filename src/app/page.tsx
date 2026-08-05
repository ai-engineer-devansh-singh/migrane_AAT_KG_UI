'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { ModeSelector } from '@/components/ModeSelector';
import { RetrievalModeSelector } from '@/components/RetrievalModeSelector';
import { PatientSelector } from '@/components/PatientSelector';
import { QuestionInput } from '@/components/QuestionInput';
import { AnswerCard } from '@/components/AnswerCard';
import { RetrievedFacts } from '@/components/RetrievedFacts';
import { SubgraphGraph } from '@/components/SubgraphGraph';
import { DecorativeShapes } from '@/components/DecorativeShapes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  askQuestion,
  downloadFile,
  fetchHealth,
  fetchPatients,
  Patient,
  QAResponse,
  RetrievalMode,
} from '@/lib/api';
import { Loader2, AlertTriangle } from 'lucide-react';

type Mode = 'public' | 'personal';

const PUBLIC_EXAMPLES = [
  'How long does an aura typically last?',
  'Does migraine cause fever?',
  'How many headache days per month define chronic migraine?',
  'When should I take sumatriptan for a migraine?',
  'Which migraine drugs are unsafe in pregnancy?',
  'When is a headache a medical emergency?',
];

const PERSONAL_EXAMPLES: Record<string, string> = {
  patient_a: 'Is my migraine getting worse?',
  patient_b: 'Am I getting chronic migraine?',
  patient_c: 'Is my aura changing over time?',
};

export default function Home() {
  const [mode, setMode] = useState<Mode>('public');
  const [retrievalMode, setRetrievalMode] = useState<RetrievalMode>('hybrid');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [health, setHealth] = useState<{ neo4j_connected: boolean } | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QAResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [filterNodeId, setFilterNodeId] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch((e) => setError(`Health check failed: ${e.message}`))
      .finally(() => setLoadingPatients(false));

    fetchPatients()
      .then((data) => {
        setPatients(data);
        if (data.length > 0) {
          setSelectedPatient(data[0].patient_id);
        }
      })
      .catch((e) => setError(`Failed to load patients: ${e.message}`));
  }, []);

  const handleAsk = async (question: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await askQuestion({
        question,
        mode,
        patient_id: mode === 'personal' ? selectedPatient : null,
        retrieval_mode: retrievalMode,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (q: string) => {
    setQuestion(q);
    handleAsk(q);
  };

  const selectedPatientName = patients.find((p) => p.patient_id === selectedPatient)?.name || null;
  const examples = mode === 'personal' && selectedPatient
    ? [PERSONAL_EXAMPLES[selectedPatient]].filter(Boolean)
    : PUBLIC_EXAMPLES;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero band */}
        <section className="border-b border-hairline bg-surface-soft">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-[1fr_340px] md:py-20">
            <div className="space-y-5">
              <p className="text-caption-uppercase uppercase text-muted">MigraineAAT-KG</p>
              <h1 className="font-display text-display-md tracking-tight text-ink md:text-display-lg">
                Ask your migraine knowledge graph
              </h1>
              <p className="max-w-xl text-body-md text-body">
                Assertion-aware, temporal QA over ICHD-3 public knowledge and
                personal patient timelines. See the retrieved triples and the
                generated answer in one place.
              </p>
            </div>
            <DecorativeShapes className="mx-auto w-full max-w-[300px] md:max-w-[340px]" />
          </div>
        </section>

        {/* QA workspace */}
        <section className="px-4 py-8 md:py-12">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            {/* Left column: controls + answer */}
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!health?.neo4j_connected && !loadingPatients && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Neo4j disconnected</AlertTitle>
                  <AlertDescription>
                    The backend cannot reach Neo4j. Personal mode and retrieved facts may not work.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-hairline bg-surface-card p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <ModeSelector mode={mode} onChange={setMode} />
                  <RetrievalModeSelector
                    mode={retrievalMode}
                    onChange={setRetrievalMode}
                    disabled={!health?.neo4j_connected}
                  />
                </div>
                {mode === 'personal' && (
                  <PatientSelector
                    patients={patients}
                    selected={selectedPatient}
                    onSelect={setSelectedPatient}
                    disabled={patients.length === 0}
                  />
                )}
              </div>

              <div className="rounded-xl bg-brand-teal p-6 text-on-dark md:p-8">
                <QuestionInput
                  onSubmit={handleAsk}
                  disabled={loading || !health?.neo4j_connected}
                  variant="on-color"
                  value={question}
                  onValueChange={setQuestion}
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  {examples.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => handleExample(ex)}
                      disabled={loading || !health?.neo4j_connected}
                      className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-caption text-white/90 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <div className="flex items-center gap-2 text-body-sm text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Retrieving facts and generating answer…
                </div>
              )}

              <AnswerCard
                question={result?.question}
                answer={result?.answer}
                mode={result?.mode}
                retrievalMode={result?.retrieval_mode ?? retrievalMode}
                patientName={mode === 'personal' ? selectedPatientName : null}
                tripleCount={result?.retrieval.triple_count}
                retrievalTimeMs={result?.retrieval.retrieval_time_ms}
                llmUsed={result?.llm_used}
                disclaimer={result?.disclaimer}
                loading={loading}
                onExport={
                  result
                    ? () =>
                        downloadFile(
                          `qa_session_${result.mode}.json`,
                          JSON.stringify(result, null, 2),
                          'application/json'
                        )
                    : undefined
                }
              />
            </div>

            {/* Right column: graph + retrieved facts */}
            <div className="space-y-6">
              {result ? (
                <>
                  <SubgraphGraph
                    triples={result.triples}
                    topKNodes={result.retrieval.top_k_nodes}
                    onFilterFacts={setFilterNodeId}
                  />
                  <RetrievedFacts
                    facts={result.triples}
                    tripleCount={result.retrieval.triple_count}
                    retrievalTimeMs={result.retrieval.retrieval_time_ms}
                    assertionFilter={result.retrieval.assertion_filter}
                    temporalFocus={result.retrieval.temporal_focus}
                    filterNodeId={filterNodeId}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-hairline bg-surface-card px-6 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-soft text-muted">
                    <Loader2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-body-sm font-medium text-ink">
                      Retrieved subgraph and facts
                    </p>
                    <p className="text-caption text-muted">
                      Ask a question to see the ranked subgraph, retrieval scores, and
                      provenance-cited facts appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
